import React, { useState } from 'react';
import { Quote, Job, Timeline, CompanySettings } from '../types';
import { generateTimelineReport } from '../pdfGenerator';
import { generateSmartTimeline } from '../services/geminiService';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  GripVertical,
  Link as LinkIcon,
  Sparkles,
  RefreshCw,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmationModal } from './ConfirmationModal';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TimelineEditorProps {
  quote: Quote;
  onChange: (timeline: Timeline) => void;
  settings?: CompanySettings;
}

interface SortableJobItemProps {
  job: Job;
  quote: Quote;
  updateJob: (jobId: string, updates: Partial<Job>) => void;
  removeJob: (jobId: string) => void;
}

const SortableJobItem: React.FC<SortableJobItemProps> = ({ job, quote, updateJob, removeJob }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  const linkedItem = quote.items.find(item => item.id === job.itemId);

  const getStatusIcon = (status: Job['status']) => {
    switch (status) {
      case 'Completed': return <CheckCircle2 size={14} className="text-emerald-500" />;
      case 'In Progress': return <Clock size={14} className="text-blue-500" />;
      case 'Delayed': return <AlertCircle size={14} className="text-red-500" />;
      default: return <Clock size={14} className="text-slate-400" />;
    }
  };

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Delayed': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative"
    >
      <div className="flex flex-wrap gap-3 items-start">
        {/* Drag Handle */}
        <div 
          {...attributes} 
          {...listeners}
          className="absolute left-0.5 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-900 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical size={14} />
        </div>

        <div className="flex-1 min-w-[200px] space-y-2 ml-3">
          <div className="flex items-center gap-2">
            <div className={cn("p-1 rounded-md border", getStatusColor(job.status))}>
              {getStatusIcon(job.status)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={job.title ?? ''}
                  onChange={(e) => updateJob(job.id, { title: e.target.value })}
                  className="flex-1 bg-transparent border-none p-0 text-[11px] font-bold text-slate-900 focus:ring-0"
                />
                <select
                  value={job.itemId || ''}
                  onChange={(e) => updateJob(job.id, { itemId: e.target.value })}
                  className="bg-slate-50 border border-slate-100 rounded-md px-1 py-0.5 text-[8px] font-bold text-slate-400 hover:text-slate-900 transition-all focus:ring-1 focus:ring-blue-600 w-24"
                >
                  <option value="">No Link</option>
                  {quote.items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.no}. {item.name || item.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>
              {linkedItem && (
                <div className="flex items-center gap-1 mt-0.5">
                  <LinkIcon size={8} className="text-blue-500" />
                  <p className="text-[8px] font-bold text-slate-400 tracking-widest">
                    Linked: <span className="text-blue-600 font-bold">{linkedItem.no}. {linkedItem.name || `Item ${linkedItem.id.slice(0, 4)}`}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          <textarea
            value={job.description ?? ''}
            onChange={(e) => updateJob(job.id, { description: e.target.value })}
            placeholder="Job description..."
            className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-[10px] font-medium text-slate-600 focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all resize-none h-12"
          />
        </div>

        <div className="w-full lg:w-56 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <label className="text-[7px] font-bold text-slate-400 tracking-widest ml-1">Start</label>
              <div className="relative">
                <Calendar size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={job.startDate ?? ''}
                  onChange={(e) => updateJob(job.id, { startDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-6 pr-1.5 py-1 text-[9px] font-bold focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>
            <div className="space-y-0.5">
              <label className="text-[7px] font-bold text-slate-400 tracking-widest ml-1">End</label>
              <div className="relative">
                <Calendar size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={job.endDate ?? ''}
                  onChange={(e) => updateJob(job.id, { endDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-6 pr-1.5 py-1 text-[9px] font-bold focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-0.5">
            <label className="text-[7px] font-bold text-slate-400 tracking-widest ml-1">Status & Progress</label>
            <div className="flex gap-1.5">
              <select
                value={job.status}
                onChange={(e) => updateJob(job.id, { status: e.target.value as any })}
                className="flex-1 bg-slate-50 border border-slate-100 rounded-lg px-1.5 py-1 text-[9px] font-bold focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Delayed">Delayed</option>
              </select>
              <div className="w-14 relative">
                <input
                  type="number"
                  value={job.progress ?? 0}
                  min="0"
                  max="100"
                  onChange={(e) => updateJob(job.id, { progress: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg px-1.5 py-1 text-[9px] font-bold focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all text-center"
                />
                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-400">%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <div className="flex -space-x-1">
              <div className="w-5 h-5 rounded-full bg-slate-100 border border-white flex items-center justify-center text-slate-400">
                <User size={10} />
              </div>
              <button className="w-5 h-5 rounded-full bg-blue-600 border border-white flex items-center justify-center text-white hover:scale-110 transition-transform">
                <Plus size={10} />
              </button>
            </div>
            <button
              onClick={() => removeJob(job.id)}
              className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Progress Bar */}
      <div className="mt-3 space-y-1.5">
        <div className="flex justify-between items-end px-0.5">
          <div className="space-y-0.5">
            <span className="text-[7px] font-bold text-slate-400 tracking-widest block">Progress</span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-slate-900 leading-none">{job.progress}%</span>
              <span className={cn(
                "px-1 py-0.5 rounded-full text-[6px] font-bold tracking-widest",
                job.progress === 100 ? "bg-emerald-100 text-emerald-700" :
                job.progress > 0 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
              )}>
                {job.progress === 100 ? 'Completed' : job.progress > 0 ? 'In Progress' : 'Pending'}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[7px] font-bold text-slate-400 tracking-widest">Status</span>
            <select
              value={job.status ?? 'Pending'}
              onChange={(e) => updateJob(job.id, { status: e.target.value as any })}
              className={cn(
                "bg-transparent border-none p-0 text-[9px] font-bold tracking-widest focus:ring-0 text-right cursor-pointer",
                job.status === 'Completed' ? 'text-emerald-600' :
                job.status === 'Delayed' ? 'text-red-600' :
                job.status === 'In Progress' ? 'text-blue-600' : 'text-slate-400'
              )}
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>
        </div>
        <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden group/progress shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${job.progress}%` }}
            className={cn(
              "h-full transition-all duration-500 relative",
              job.status === 'Completed' ? 'bg-emerald-500' :
              job.status === 'Delayed' ? 'bg-red-500' : 'bg-blue-600'
            )}
          >
            <motion.div 
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-1/2"
            />
          </motion.div>
          <input
            type="range"
            min="0"
            max="100"
            value={job.progress ?? 0}
            onChange={(e) => updateJob(job.id, { progress: parseInt(e.target.value) })}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer accent-blue-600 z-10"
          />
        </div>
        <div className="flex justify-between px-0.5">
          <span className="text-[6px] font-bold text-slate-300 tracking-widest">0%</span>
          <span className="text-[6px] font-bold text-slate-300 tracking-widest">50%</span>
          <span className="text-[6px] font-bold text-slate-300 tracking-widest">100%</span>
        </div>
      </div>
    </div>
  );
};

const GanttView: React.FC<{ jobs: Job[] }> = ({ jobs }) => {
  if (jobs.length === 0) return null;

  const sortedJobs = [...jobs].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const minDate = new Date(Math.min(...sortedJobs.map(j => new Date(j.startDate).getTime())));
  const maxDate = new Date(Math.max(...sortedJobs.map(j => new Date(j.endDate).getTime())));
  
  // Add some padding to dates
  minDate.setDate(minDate.getDate() - 2);
  maxDate.setDate(maxDate.getDate() + 5);

  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  const dayWidth = 40; // pixels per day

  const getLeft = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = Math.ceil((date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff * dayWidth;
  };

  const getWidth = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff * dayWidth;
  };

  return (
    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Project timeline visualization</h3>
          <p className="text-[10px] font-bold text-slate-400 tracking-tight">Gantt chart view</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="text-[9px] font-bold text-slate-500 tracking-tight">Planned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-bold text-slate-500 tracking-tight">Completed</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto relative">
        <div className="inline-block min-w-full">
          {/* Timeline Header (Days/Dates) */}
          <div className="sticky top-0 z-20 flex bg-white border-b border-slate-100 h-12">
            <div className="w-48 shrink-0 border-r border-slate-100 bg-slate-50/50 flex items-center px-4 sticky left-0 z-30">
              <span className="text-[10px] font-bold text-slate-400 tracking-tight">Task name</span>
            </div>
            <div className="flex relative">
              {Array.from({ length: totalDays }).map((_, i) => {
                const date = new Date(minDate);
                date.setDate(date.getDate() + i);
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                const isToday = date.toDateString() === new Date().toDateString();
                
                return (
                  <div 
                    key={i} 
                    style={{ width: dayWidth }} 
                    className={cn(
                      "shrink-0 border-r border-slate-50 flex flex-col items-center justify-center text-[8px] font-bold transition-colors",
                      isWeekend ? "bg-slate-50/30 text-slate-300" : "text-slate-400",
                      isToday && "bg-blue-50/50 text-blue-600 ring-1 ring-inset ring-blue-100"
                    )}
                  >
                    <span>{date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}</span>
                    <span>{date.getDate()}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid Lines Overlay */}
          <div className="absolute top-12 left-48 right-0 bottom-0 pointer-events-none flex">
            {Array.from({ length: totalDays }).map((_, i) => {
              const date = new Date(minDate);
              date.setDate(date.getDate() + i);
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              return (
                <div 
                  key={i} 
                  style={{ width: dayWidth }} 
                  className={cn(
                    "h-full border-r border-slate-50/50",
                    isWeekend && "bg-slate-50/20"
                  )} 
                />
              );
            })}
          </div>

          {/* Tasks Rows */}
          <div className="relative">
            {sortedJobs.map((job, idx) => (
              <div key={job.id} className="flex border-b border-slate-50 hover:bg-slate-50/30 transition-colors group">
                <div className="w-48 shrink-0 border-r border-slate-100 p-3 flex items-center sticky left-0 z-10 bg-white group-hover:bg-slate-50/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-900 truncate">{job.title}</p>
                    <p className="text-[8px] text-slate-400 truncate">{job.status}</p>
                  </div>
                </div>
                <div className="flex-1 relative py-3 h-14">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{ 
                      left: getLeft(job.startDate), 
                      width: getWidth(job.startDate, job.endDate) 
                    }}
                    className={cn(
                      "absolute h-8 rounded-lg shadow-sm flex items-center px-3 overflow-hidden group/bar cursor-pointer",
                      job.status === 'Completed' ? 'bg-emerald-500 shadow-emerald-100' :
                      job.status === 'Delayed' ? 'bg-red-500 shadow-red-100' :
                      'bg-blue-600 shadow-blue-100'
                    )}
                  >
                    {/* Progress Fill */}
                    <div 
                      className="absolute inset-0 bg-black/10 transition-all duration-500" 
                      style={{ width: `${job.progress}%` }} 
                    />
                    
                    <span className="relative z-10 text-[9px] font-bold text-white truncate drop-shadow-sm">
                      {job.progress}%
                    </span>

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none z-50">
                      <div className="bg-slate-800 text-white text-[9px] font-bold py-1.5 px-2.5 rounded-lg whitespace-nowrap shadow-xl">
                        {job.title} ({job.startDate} - {job.endDate})
                      </div>
                      <div className="w-2 h-2 bg-slate-800 rotate-45 mx-auto -mt-1" />
                    </div>
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const TimelineEditor: React.FC<TimelineEditorProps> = ({ quote, onChange, settings }) => {
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'gantt'>('list');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [newJob, setNewJob] = useState<Partial<Job>>({
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Pending',
    progress: 0,
    itemId: ''
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const timeline = quote.timeline || { id: crypto.randomUUID(), quoteId: quote.id, jobs: [] };

  const updateJob = (jobId: string, updates: Partial<Job>) => {
    const newJobs = timeline.jobs.map(j => j.id === jobId ? { ...j, ...updates } : j);
    onChange({ ...timeline, jobs: newJobs });
  };

  const removeJob = (jobId: string) => {
    const newJobs = timeline.jobs.filter(j => j.id !== jobId);
    onChange({ ...timeline, jobs: newJobs });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = timeline.jobs.findIndex((j) => j.id === active.id);
      const newIndex = timeline.jobs.findIndex((j) => j.id === over.id);

      const newJobs = arrayMove(timeline.jobs, oldIndex, newIndex);
      onChange({ ...timeline, jobs: newJobs });
    }
  };

  const addCustomJob = () => {
    if (!newJob.title) return;
    const job: Job = {
      id: crypto.randomUUID(),
      title: newJob.title!,
      description: newJob.description || '',
      startDate: newJob.startDate!,
      endDate: newJob.endDate!,
      status: newJob.status as any || 'Pending',
      progress: newJob.progress || 0,
      itemId: newJob.itemId
    };
    onChange({ ...timeline, jobs: [...timeline.jobs, job] });
    setIsAddingCustom(false);
    setNewJob({
      title: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Pending',
      progress: 0,
      itemId: ''
    });
  };

  const handleAIGenerateTimeline = async () => {
    setIsGeneratingAI(true);
    try {
      const jobs = await generateSmartTimeline(quote.projectName || 'New Project', quote.items);
      if (jobs.length > 0) {
        onChange({ ...timeline, jobs: [...timeline.jobs, ...jobs] });
      }
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const clearTimeline = () => {
    setShowClearConfirm(true);
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      await generateTimelineReport(quote, settings);
    } catch (error) {
      console.error('Failed to generate timeline report:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-4 p-1">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900">Project Timeline</h2>
          <p className="text-[9px] font-bold text-slate-400 tracking-widest">Schedule and job management</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl mr-2">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[9px] font-bold tracking-widest transition-all",
                viewMode === 'list' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('gantt')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[9px] font-bold tracking-widest transition-all",
                viewMode === 'gantt' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Gantt Chart
            </button>
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            className="flex items-center gap-1 px-3 py-1.5 bg-white text-blue-600 border border-blue-200 rounded-lg font-bold tracking-widest text-[9px] hover:bg-blue-50 transition-all shadow-sm disabled:opacity-50"
          >
            <FileText size={12} /> {isGeneratingReport ? 'Generating...' : 'Generate Report'}
          </button>
          <button
            onClick={handleAIGenerateTimeline}
            disabled={isGeneratingAI}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-bold tracking-widest text-[9px] hover:bg-amber-100 transition-all shadow-sm",
              isGeneratingAI && "animate-pulse"
            )}
          >
            <Sparkles size={12} className={cn("text-amber-500", isGeneratingAI && "animate-spin")} />
            {isGeneratingAI ? 'Generating...' : 'AI Smart Timeline'}
          </button>
          <button
            onClick={clearTimeline}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg font-bold tracking-widest text-[9px] hover:bg-slate-100 transition-all shadow-sm"
          >
            <RefreshCw size={12} /> Clear
          </button>
          <button
            onClick={() => setIsAddingCustom(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold tracking-widest text-[9px] hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            <Plus size={12} /> Add Custom Job
          </button>
        </div>
      </div>

      {viewMode === 'gantt' ? (
        <GanttView jobs={timeline.jobs} />
      ) : (
        <div className="grid grid-cols-1 gap-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={timeline.jobs.map(j => j.id)}
              strategy={verticalListSortingStrategy}
            >
              <AnimatePresence mode="popLayout">
                {timeline.jobs.map((job) => (
                  <SortableJobItem
                    key={job.id}
                    job={job}
                    quote={quote}
                    updateJob={updateJob}
                    removeJob={removeJob}
                  />
                ))}
              </AnimatePresence>
            </SortableContext>
          </DndContext>

          {timeline.jobs.length === 0 && (
            <div className="py-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
              <Calendar size={24} className="mx-auto text-slate-200 mb-2" />
              <p className="text-slate-500 font-bold text-xs">No jobs scheduled yet</p>
              <p className="text-[9px] text-slate-400 mt-1 tracking-widest">Add items to BOQ or create custom jobs</p>
            </div>
          )}
        </div>
      )}

      <ConfirmationModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => onChange({ ...timeline, jobs: [] })}
        title="Clear Timeline"
        message="Are you sure you want to clear the entire project timeline? This will remove all scheduled jobs. This action cannot be undone."
        confirmText="Clear All"
        type="danger"
      />

      {/* Custom Job Modal */}
      {isAddingCustom && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-4 w-full max-w-sm shadow-2xl border border-slate-200"
          >
            <h3 className="text-base font-bold tracking-tight mb-3">Add Custom Job</h3>
            <div className="space-y-2.5">
              <div className="space-y-0.5">
                <label className="text-[8px] font-bold text-slate-400 tracking-widest ml-1">Job Title</label>
                <input
                  type="text"
                  value={newJob.title ?? ''}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  placeholder="e.g. Site Preparation"
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 text-[11px] font-bold focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[8px] font-bold text-slate-400 tracking-widest ml-1">Link to BOQ Item (Optional)</label>
                <select
                  value={newJob.itemId ?? ''}
                  onChange={(e) => setNewJob({ ...newJob, itemId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 text-[11px] font-bold focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
                >
                  <option value="">No Link</option>
                  {quote.items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.no}. {item.name || 'Untitled Item'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-0.5">
                <label className="text-[8px] font-bold text-slate-400 tracking-widest ml-1">Description</label>
                <textarea
                  value={newJob.description ?? ''}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  placeholder="What needs to be done?"
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 text-[10px] font-medium text-slate-600 focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all h-16 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[8px] font-bold text-slate-400 tracking-widest ml-1">Start Date</label>
                  <input
                    type="date"
                    value={newJob.startDate ?? ''}
                    onChange={(e) => setNewJob({ ...newJob, startDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 text-[10px] font-bold focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] font-bold text-slate-400 tracking-widest ml-1">End Date</label>
                  <input
                    type="date"
                    value={newJob.endDate ?? ''}
                    onChange={(e) => setNewJob({ ...newJob, endDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 text-[10px] font-bold focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setIsAddingCustom(false)}
                className="flex-1 py-2 bg-slate-100 text-slate-900 rounded-lg font-bold tracking-widest text-[9px] hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={addCustomJob}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold tracking-widest text-[9px] hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
              >
                Add Job
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
