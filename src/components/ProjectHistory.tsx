import React, { useMemo } from 'react';
import { 
  FileText, 
  PlusCircle, 
  CreditCard, 
  DollarSign, 
  FileCode, 
  History, 
  ChevronRight, 
  Clock, 
  Info
} from 'lucide-react';
import { Project, Quote, Invoice, Payment, Adjustment } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface ProjectHistoryProps {
  project: Project;
  quotes: Quote[];
  invoices: Invoice[];
  payments: Payment[];
  adjustments: Adjustment[];
  onViewItem: (type: 'Quote' | 'Invoice' | 'Payment' | 'Adjustment' | 'Variation' | 'Report' | 'Accounting Report', id: string) => void;
}

export const ProjectHistory: React.FC<ProjectHistoryProps> = ({
  project,
  quotes,
  invoices,
  payments,
  adjustments,
  onViewItem
}) => {
  const projectQuotes = useMemo(() => quotes.filter(q => q.projectId === project.id || q.id === project.quoteId), [quotes, project]);
  const projectInvoices = useMemo(() => invoices.filter(i => i.projectId === project.id), [invoices, project]);
  const projectPayments = useMemo(() => payments.filter(p => p.projectId === project.id), [payments, project]);
  const projectAdjustments = useMemo(() => adjustments.filter(a => a.projectId === project.id), [adjustments, project]);
  const projectAuditLogs = useMemo(() => project.auditLogs || [], [project]);

  // Combine all into a single timeline
  const timelineItems = useMemo(() => {
    const items: any[] = [];

    projectQuotes.forEach(q => items.push({
      id: q.id,
      type: 'Quote',
      title: `Quotation ${q.quoteNo}`,
      subtitle: q.status,
      date: q.updatedAt || q.createdAt,
      amount: q.grandTotal,
      icon: <FileText size={16} />,
      color: 'blue'
    }));

    projectInvoices.forEach(i => items.push({
      id: i.id,
      type: 'Invoice',
      title: `Invoice ${i.invoiceNo}`,
      subtitle: i.status,
      date: i.updatedAt || i.createdAt,
      amount: i.grandTotal,
      icon: <FileCode size={16} />,
      color: 'amber'
    }));

    projectPayments.forEach(p => items.push({
      id: p.id,
      type: 'Payment',
      title: `Payment ${p.paymentNo}`,
      subtitle: p.method,
      date: p.date,
      amount: p.amount,
      icon: <CreditCard size={16} />,
      color: 'emerald'
    }));

    projectAdjustments.forEach(a => items.push({
      id: a.id,
      type: 'Adjustment',
      title: `Adjustment: ${a.type}`,
      subtitle: a.reason,
      date: a.date,
      amount: a.amount,
      icon: <DollarSign size={16} />,
      color: 'rose'
    }));

    projectAuditLogs.forEach(log => {
      if (log.type === 'Variation') {
        items.push({
          id: log.id,
          type: 'Variation',
          title: log.action,
          subtitle: log.details,
          date: log.timestamp,
          icon: <PlusCircle size={16} />,
          color: 'indigo'
        });
      } else if (log.type === 'Accounting') {
        items.push({
          id: log.id,
          type: 'Accounting Report',
          title: log.action,
          subtitle: log.details,
          date: log.timestamp,
          icon: <FileCode size={16} />,
          color: 'slate'
        });
      }
    });

    (project.reports || []).forEach(report => {
      items.push({
        id: report.id,
        type: 'Report',
        title: report.title,
        subtitle: report.type,
        date: report.createdAt,
        icon: <FileText size={16} />,
        color: 'purple'
      });
    });

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [projectQuotes, projectInvoices, projectPayments, projectAdjustments, projectAuditLogs, project.reports]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Project History</h2>
          <p className="text-xs text-slate-500 font-medium">Timeline of all documents and activities</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl">
          <History size={14} className="text-slate-400" />
          <span className="text-[10px] font-bold text-slate-600 tracking-widest">{timelineItems.length} Events</span>
        </div>
      </div>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200" />

        <div className="space-y-6">
          {timelineItems.map((item, index) => (
            <motion.div
              key={`${item.type}-${item.id}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative pl-14 group"
            >
              {/* Timeline Dot */}
              <div className={cn(
                "absolute left-[18px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ring-4 ring-slate-50 z-10 transition-all group-hover:scale-125",
                item.color === 'blue' ? "bg-blue-600 ring-blue-50" :
                item.color === 'amber' ? "bg-amber-600 ring-amber-50" :
                item.color === 'emerald' ? "bg-emerald-600 ring-emerald-50" :
                item.color === 'rose' ? "bg-rose-600 ring-rose-50" :
                item.color === 'indigo' ? "bg-indigo-600 ring-indigo-50" :
                item.color === 'slate' ? "bg-slate-600 ring-slate-50" :
                item.color === 'purple' ? "bg-purple-600 ring-purple-50" :
                "bg-slate-400 ring-slate-50"
              )} />

              <div 
                onClick={() => onViewItem(item.type, item.id)}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group/card"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover/card:scale-110",
                      item.color === 'blue' ? "bg-blue-50 text-blue-600" :
                      item.color === 'amber' ? "bg-amber-50 text-amber-600" :
                      item.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                      item.color === 'rose' ? "bg-rose-50 text-rose-600" :
                      item.color === 'indigo' ? "bg-indigo-50 text-indigo-600" :
                      item.color === 'slate' ? "bg-slate-50 text-slate-600" :
                      item.color === 'purple' ? "bg-purple-50 text-purple-600" :
                      "bg-slate-50 text-slate-600"
                    )}>
                      {item.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-slate-900 group-hover/card:text-blue-600 transition-colors">{item.title}</h3>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[8px] font-bold tracking-tight",
                          item.color === 'blue' ? "bg-blue-50 text-blue-600" :
                          item.color === 'amber' ? "bg-amber-50 text-amber-600" :
                          item.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                          item.color === 'rose' ? "bg-rose-50 text-rose-600" :
                          item.color === 'indigo' ? "bg-indigo-50 text-indigo-600" :
                          item.color === 'slate' ? "bg-slate-50 text-slate-600" :
                          item.color === 'purple' ? "bg-purple-50 text-purple-600" :
                          "bg-slate-50 text-slate-600"
                        )}>
                          {item.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium line-clamp-1">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    {item.amount !== undefined && (
                      <p className="text-sm font-bold text-slate-900 mb-1">LKR {item.amount.toLocaleString()}</p>
                    )}
                    <div className="flex items-center justify-end gap-1.5 text-slate-400">
                      <Clock size={10} />
                      <span className="text-[9px] font-mono">{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between opacity-0 group-hover/card:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2">
                    <Info size={12} className="text-slate-400" />
                    <span className="text-[9px] font-bold text-slate-400 tracking-tight">Click to view details</span>
                  </div>
                  <ChevronRight size={14} className="text-blue-600" />
                </div>
              </div>
            </motion.div>
          ))}

          {timelineItems.length === 0 && (
            <div className="py-20 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
              <History size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-500 font-bold">No history found for this project</p>
              <p className="text-slate-400 text-xs mt-1">Documents and activities will appear here as they are created</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
