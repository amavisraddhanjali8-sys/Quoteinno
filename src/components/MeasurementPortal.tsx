import React, { useState, useMemo } from 'react';
import { BOQItem, MeasurementSheet, MeasurementRow, CalculationMethod, MeasurementUnit } from '../types';
import { Plus, Trash2, Calculator, X, Save, AlertCircle, Copy, ArrowUp, ArrowDown, MinusCircle, PlusCircle, Ruler, Box, Maximize, Layers, Weight, Sparkles } from 'lucide-react';
import { enhanceMeasurements } from '../services/geminiService';
import { ConfirmationModal } from './ConfirmationModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Simple math expression evaluator
const evaluateFormula = (input: string | number): number => {
  if (typeof input === 'number') return input;
  if (!input) return 0;
  try {
    // Basic sanitization: only allow numbers and + - * / . ( )
    const sanitized = input.replace(/[^0-9+\-*/.()]/g, '');
    // eslint-disable-next-line no-eval
    const result = eval(sanitized);
    return isFinite(result) ? result : 0;
  } catch {
    return 0;
  }
};

interface MeasurementPortalProps {
  item: BOQItem;
  onSave: (sheet: MeasurementSheet) => void;
  onClose: () => void;
}

const METHOD_ICONS: Record<CalculationMethod, React.ReactNode> = {
  Area: <Maximize size={18} />,
  Volume: <Box size={18} />,
  Linear: <Ruler size={18} />,
  Perimeter: <Layers size={18} />,
  Surface: <Box size={18} />,
  Weight: <Weight size={18} />,
  Unit: <PlusCircle size={18} />
};

export const MeasurementPortal: React.FC<MeasurementPortalProps> = ({ item, onSave, onClose }) => {
  const [method, setMethod] = useState<CalculationMethod>(item.measurements?.method || 'Area');
  const [unit, setUnit] = useState<MeasurementUnit>(item.measurements?.unit || 'm');
  const [rows, setRows] = useState<MeasurementRow[]>(item.measurements?.rows || [
    { id: crypto.randomUUID(), description: 'Main Section', shape: 'Rectangle', count: 1, length: 0, width: 0, height: 0, isDeduction: false, total: 0 }
  ]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleAIEnhance = async () => {
    setIsEnhancing(true);
    try {
      const suggestedRows = await enhanceMeasurements(item, method);
      if (suggestedRows.length > 0) {
        setRows(suggestedRows);
      }
    } finally {
      setIsEnhancing(false);
    }
  };

  const calculateRowTotal = (row: MeasurementRow, currentMethod: CalculationMethod) => {
    const { count, length, width, height, isDeduction, shape, radius, base, sideA, sideB } = row;
    let total = 0;
    
    // Shape-based calculations (primarily for Area/Volume)
    if (shape && shape !== 'Rectangle') {
      switch (shape) {
        case 'Triangle':
          total = count * 0.5 * (base || 0) * (height || 0);
          break;
        case 'Circle':
          total = count * Math.PI * Math.pow(radius || 0, 2);
          break;
        case 'Trapezoid':
          total = count * 0.5 * ((sideA || 0) + (sideB || 0)) * (height || 0);
          break;
        case 'Ellipse':
          total = count * Math.PI * (length / 2) * (width / 2);
          break;
        case 'Sector':
          total = count * Math.PI * Math.pow(radius || 0, 2) * ((sideA || 0) / 360);
          break;
        case 'Solid':
          total = count * length * width * height;
          break;
      }
      // If volume is requested but we calculated area, multiply by depth
      if (currentMethod === 'Volume' && shape !== 'Solid') {
        total *= (length || 1); 
      }
    } else {
      // Standard rectangular calculations
      switch (currentMethod) {
        case 'Area':
          total = count * length * width;
          break;
        case 'Volume':
          total = count * length * width * height;
          break;
        case 'Linear':
          total = count * length;
          break;
        case 'Perimeter':
          total = count * 2 * (length + width);
          break;
        case 'Surface':
          total = count * 2 * (length * width + length * height + width * height);
          break;
        case 'Weight':
          // Weight = Length * Weight per meter (stored in height)
          total = count * length * height;
          break;
        case 'Unit':
          total = count;
          break;
        default:
          total = 0;
      }
    }
    return isDeduction ? -total : total;
  };

  const updatedRows = useMemo(() => {
    return rows.map(row => ({
      ...row,
      total: calculateRowTotal(row, method)
    }));
  }, [rows, method]);

  const totalQuantity = useMemo(() => {
    return updatedRows.reduce((sum, row) => sum + row.total, 0);
  }, [updatedRows]);

  const addRow = () => {
    setRows([...rows, { 
      id: crypto.randomUUID(), 
      description: '', 
      shape: 'Rectangle',
      count: 1, 
      length: 0, 
      width: 0, 
      height: 0, 
      isDeduction: false,
      total: 0 
    }]);
  };

  const duplicateRow = (row: MeasurementRow) => {
    setRows([...rows, { ...row, id: crypto.randomUUID() }]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  const moveRow = (index: number, direction: 'up' | 'down') => {
    const newRows = [...rows];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newRows.length) {
      [newRows[index], newRows[targetIndex]] = [newRows[targetIndex], newRows[index]];
      setRows(newRows);
    }
  };

  const updateRow = (id: string, field: keyof MeasurementRow, value: any) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleSave = () => {
    const sheet: MeasurementSheet = {
      id: item.measurements?.id || crypto.randomUUID(),
      itemId: item.id,
      method,
      unit,
      rows: updatedRows,
      totalQuantity
    };
    onSave(sheet);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        {/* Header - Single Line Ribbon */}
        <div className="px-5 py-2.5 border-b border-slate-200/80 flex items-center justify-between gap-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-2xs">
              <Calculator size={16} className="text-white" />
            </div>
            <div className="flex items-baseline gap-2 min-w-0">
              <h2 className="text-sm font-bold tracking-tight text-white whitespace-nowrap">Measurement Takeoff</h2>
              <span className="text-xs text-slate-400 font-normal truncate hidden sm:inline">
                • {item.name || 'Untitled Entry'} ({item.category})
              </span>
            </div>
          </div>
          {/* Action Buttons ONLY */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAIEnhance}
              disabled={isEnhancing}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              <Sparkles size={12} className={isEnhancing ? "animate-spin" : ""} />
              <span>{isEnhancing ? "Calculating..." : "AI Assist"}</span>
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Controls - Secondary Toolbar Strip */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Method:</span>
              <div className="flex bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                {(['Area', 'Volume', 'Linear', 'Perimeter', 'Surface', 'Weight', 'Unit'] as CalculationMethod[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap",
                      method === m 
                        ? "bg-blue-600 text-white shadow-2xs" 
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {React.cloneElement(METHOD_ICONS[m] as React.ReactElement<any>, { size: 11 })}
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unit:</span>
              <div className="flex bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                {(['m', 'ft', 'in', 'mm', 'm2', 'sqft', 'm3', 'kg', 'Tons', 'Nos', 'Set'] as MeasurementUnit[]).map((u) => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    className={cn(
                      "px-1.5 py-0.5 rounded-md text-[10px] font-semibold transition-all whitespace-nowrap",
                      unit === u ? "bg-blue-600 text-white shadow-2xs" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-end min-w-[100px]">
              <span className="text-[7px] font-bold text-slate-400 tracking-tight">Net quantity</span>
              <span className="text-base font-bold text-slate-900 font-mono tracking-tighter">
                {totalQuantity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                <span className="text-[10px] text-blue-600 ml-1.5 font-sans">{item.unit}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto p-4 bg-white">
          <table className="w-full border-separate border-spacing-y-1.5">
            <thead>
              <tr className="text-left">
                <th className="px-2 py-2 w-8"></th>
                <th className="px-2 py-2 text-[8px] font-bold text-slate-400 tracking-tight">Sub-selection / Location</th>
                <th className="px-2 py-2 text-[8px] font-bold text-slate-400 tracking-tight w-24 text-center">Geometry</th>
                <th className="px-2 py-2 text-[8px] font-bold text-slate-400 tracking-tight w-14 text-center">Op</th>
                <th className="px-2 py-2 text-[8px] font-bold text-slate-400 tracking-tight w-16 text-center">Multi</th>
                <th className="px-2 py-2 text-[8px] font-bold text-slate-400 tracking-tight w-20 text-center">D.1</th>
                <th className="px-2 py-2 text-[8px] font-bold text-slate-400 tracking-tight w-20 text-center">D.2</th>
                <th className="px-2 py-2 text-[8px] font-bold text-slate-400 tracking-tight w-20 text-center">D.3</th>
                <th className="px-2 py-2 text-[8px] font-bold text-slate-400 tracking-tight w-28 text-right">Result</th>
                <th className="px-2 py-2 w-16"></th>
              </tr>
            </thead>
            <tbody className="space-y-2">
              {updatedRows.map((row, index) => (
                <tr key={row.id} className={cn(
                  "group transition-all border border-slate-100 rounded-xl overflow-hidden",
                  row.isDeduction ? "bg-red-50/50" : "bg-slate-50/30"
                )}>
                  <td className="p-0">
                    <div className="flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveRow(index, 'up')} className="text-slate-300 hover:text-blue-600 p-0.5"><ArrowUp size={10} /></button>
                      <button onClick={() => moveRow(index, 'down')} className="text-slate-300 hover:text-blue-600 p-0.5"><ArrowDown size={10} /></button>
                    </div>
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={row.description}
                      onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                      placeholder="Node description..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-bold focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-slate-300"
                    />
                  </td>
                  <td className="p-1">
                    <select
                      value={row.shape}
                      onChange={(e) => updateRow(row.id, 'shape', e.target.value)}
                      className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold tracking-tight focus:ring-1 focus:ring-blue-600 transition-all appearance-none text-center"
                    >
                      <option value="Rectangle">Rectangle</option>
                      <option value="Triangle">Triangle</option>
                      <option value="Circle">Circle</option>
                      <option value="Trapezoid">Trapezoid</option>
                      <option value="Ellipse">Ellipse</option>
                      <option value="Sector">Sector</option>
                      <option value="Solid">Solid</option>
                    </select>
                  </td>
                  <td className="p-1">
                    <button
                      onClick={() => updateRow(row.id, 'isDeduction', !row.isDeduction)}
                      className={cn(
                        "w-full h-8 rounded-lg flex items-center justify-center transition-all border shadow-sm",
                        row.isDeduction 
                          ? "bg-red-600 border-red-400 text-white" 
                          : "bg-emerald-600 border-emerald-400 text-white"
                      )}
                    >
                      {row.isDeduction ? <MinusCircle size={14} /> : <PlusCircle size={14} />}
                    </button>
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      defaultValue={row.count}
                      onBlur={(e) => updateRow(row.id, 'count', evaluateFormula(e.target.value))}
                      className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-mono font-bold text-center focus:ring-1 focus:ring-blue-600 transition-all shadow-inner"
                    />
                  </td>
                  <td className="p-1">
                    <div className="relative group/dim">
                      <input
                        type="text"
                        disabled={['Unit'].includes(method)}
                        defaultValue={row.shape === 'Circle' || row.shape === 'Sector' ? row.radius : (row.shape === 'Triangle' ? row.base : (row.shape === 'Trapezoid' ? row.sideA : row.length))}
                        onBlur={(e) => updateRow(row.id, row.shape === 'Circle' || row.shape === 'Sector' ? 'radius' : (row.shape === 'Triangle' ? 'base' : (row.shape === 'Trapezoid' ? 'sideA' : 'length')), evaluateFormula(e.target.value))}
                        className={cn(
                          "w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-mono font-black text-center focus:ring-1 focus:ring-blue-600 transition-all shadow-inner",
                          ['Unit'].includes(method) && "opacity-20 cursor-not-allowed"
                        )}
                      />
                      <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-white px-1 text-[6px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        {row.shape === 'Circle' || row.shape === 'Sector' ? 'Rad' : (row.shape === 'Triangle' ? 'Base' : (row.shape === 'Trapezoid' ? 'S.A' : 'Len'))}
                      </span>
                    </div>
                  </td>
                  <td className="p-1">
                    <div className="relative group/dim">
                      <input
                        type="text"
                        disabled={['Linear', 'Unit', 'Weight'].includes(method) || row.shape === 'Circle'}
                        defaultValue={row.shape === 'Trapezoid' ? row.sideB : (row.shape === 'Sector' ? row.sideA : row.width)}
                        onBlur={(e) => updateRow(row.id, row.shape === 'Trapezoid' ? 'sideB' : (row.shape === 'Sector' ? 'sideA' : 'width'), evaluateFormula(e.target.value))}
                        className={cn(
                          "w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-mono font-black text-center focus:ring-1 focus:ring-blue-600 transition-all shadow-inner",
                          (['Linear', 'Unit', 'Weight'].includes(method) || row.shape === 'Circle') && "opacity-20 cursor-not-allowed"
                        )}
                      />
                      <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-white px-1 text-[6px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        {row.shape === 'Trapezoid' ? 'S.B' : (row.shape === 'Sector' ? 'Deg' : 'Wid')}
                      </span>
                    </div>
                  </td>
                  <td className="p-1">
                    <div className="relative group/dim">
                      <input
                        type="text"
                        disabled={['Linear', 'Perimeter', 'Unit'].includes(method) && row.shape === 'Rectangle'}
                        defaultValue={row.height}
                        onBlur={(e) => updateRow(row.id, 'height', evaluateFormula(e.target.value))}
                        className={cn(
                          "w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-mono font-black text-center focus:ring-1 focus:ring-blue-600 transition-all shadow-inner",
                          (['Linear', 'Perimeter', 'Unit'].includes(method) && row.shape === 'Rectangle') && "opacity-20 cursor-not-allowed"
                        )}
                      />
                      <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-white px-1 text-[6px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        {method === 'Weight' ? 'W/M' : 'Hgt'}
                      </span>
                    </div>
                  </td>
                  <td className="p-1 text-right">
                    <div className={cn(
                      "px-3 py-2 rounded-lg text-[11px] font-mono font-black border shadow-inner",
                      row.isDeduction ? "bg-red-50 border-red-100 text-red-600" : "bg-slate-100 border-slate-200 text-slate-900"
                    )}>
                      {row.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="p-1">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => duplicateRow(row)}
                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-100"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        onClick={() => removeRow(row.id)}
                        className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border border-slate-100"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={addRow}
            className="mt-4 flex items-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 transition-all w-full justify-center group"
          >
            <Plus size={14} className="group-hover:rotate-90 transition-transform duration-200" />
            <span className="font-black tracking-widest text-[10px] uppercase">Append Computational Node</span>
          </button>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3 text-slate-400 max-w-sm">
            <AlertCircle size={14} className="shrink-0 text-blue-500" />
            <p className="text-[10px] font-bold leading-tight uppercase tracking-tighter">
              Formula Engine Active. Expressions supported. Deductions contribute to negative net scalar.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-4 py-2 bg-white text-red-600 border border-red-100 rounded-lg font-black tracking-widest text-[9px] uppercase hover:bg-red-600 hover:text-white transition-all shadow-sm"
            >
              Flush All
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1" />
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg font-black tracking-widest text-[9px] uppercase hover:bg-slate-50 transition-all shadow-sm"
            >
              Abort
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-black tracking-widest text-[9px] uppercase hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <Save size={14} /> Commit to BOQ
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => setRows([{ id: crypto.randomUUID(), description: 'Main Section', shape: 'Rectangle', count: 1, length: 0, width: 0, height: 0, isDeduction: false, total: 0 }])}
        title="Clear All Measurements"
        message="Are you sure you want to clear all measurement lines? This action cannot be undone."
        confirmText="Clear All"
        type="danger"
      />
    </div>
  );
};
