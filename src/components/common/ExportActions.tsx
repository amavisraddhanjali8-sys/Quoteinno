import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface ExportActionsProps {
  onExportCSV: () => void | Promise<void>;
  onExportPDF: () => void | Promise<void>;
  labelCSV?: string;
  labelPDF?: string;
  className?: string;
  size?: 'sm' | 'xs';
  showDropdown?: boolean;
}

export const ExportActions: React.FC<ExportActionsProps> = ({
  onExportCSV,
  onExportPDF,
  labelCSV = 'Export CSV',
  labelPDF = 'Export PDF',
  className = '',
  size = 'xs',
  showDropdown = false
}) => {
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleCSV = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExportingCSV(true);
    try {
      await onExportCSV();
      toast.success('CSV spreadsheet generated and downloaded successfully.');
    } catch (err: any) {
      console.error('CSV Export error:', err);
      toast.error('Failed to export CSV: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsExportingCSV(false);
      setIsOpen(false);
    }
  };

  const handlePDF = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExportingPDF(true);
    try {
      await onExportPDF();
      toast.success('PDF report generated and downloaded successfully.');
    } catch (err: any) {
      console.error('PDF Export error:', err);
      toast.error('Failed to export PDF: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsExportingPDF(false);
      setIsOpen(false);
    }
  };

  const isSmall = size === 'xs';

  if (showDropdown) {
    return (
      <div className={cn("relative inline-block text-left", className)}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-1.5 font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg shadow-2xs transition-all",
            isSmall ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-xs"
          )}
        >
          <Download size={13} className="text-orange-500" />
          <span>Export</span>
          <ChevronDown size={11} className={cn("text-slate-400 transition-transform", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-slate-200/90 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
            <button
              type="button"
              onClick={handleCSV}
              disabled={isExportingCSV}
              className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isExportingCSV ? (
                <Loader2 size={13} className="animate-spin text-emerald-600" />
              ) : (
                <FileSpreadsheet size={13} className="text-emerald-600" />
              )}
              <span className="font-medium">{labelCSV}</span>
            </button>
            <button
              type="button"
              onClick={handlePDF}
              disabled={isExportingPDF}
              className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-rose-50 hover:text-rose-800 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isExportingPDF ? (
                <Loader2 size={13} className="animate-spin text-rose-600" />
              ) : (
                <FileText size={13} className="text-rose-600" />
              )}
              <span className="font-medium">{labelPDF}</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <button
        type="button"
        onClick={handleCSV}
        disabled={isExportingCSV}
        title="Download CSV spreadsheet"
        className={cn(
          "flex items-center gap-1.5 font-semibold text-slate-700 bg-white hover:bg-emerald-50/60 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200/90 rounded-lg shadow-2xs transition-all active:scale-[0.98] disabled:opacity-50",
          isSmall ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-xs"
        )}
      >
        {isExportingCSV ? (
          <Loader2 size={13} className="animate-spin text-emerald-600" />
        ) : (
          <FileSpreadsheet size={13} className="text-emerald-600" />
        )}
        <span>{labelCSV}</span>
      </button>

      <button
        type="button"
        onClick={handlePDF}
        disabled={isExportingPDF}
        title="Download high-resolution PDF report"
        className={cn(
          "flex items-center gap-1.5 font-semibold text-slate-700 bg-white hover:bg-rose-50/60 hover:text-rose-800 hover:border-rose-300 border border-slate-200/90 rounded-lg shadow-2xs transition-all active:scale-[0.98] disabled:opacity-50",
          isSmall ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-xs"
        )}
      >
        {isExportingPDF ? (
          <Loader2 size={13} className="animate-spin text-rose-600" />
        ) : (
          <FileText size={13} className="text-rose-600" />
        )}
        <span>{labelPDF}</span>
      </button>
    </div>
  );
};
