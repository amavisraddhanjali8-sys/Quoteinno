import React, { useState, useMemo } from 'react';
import { 
  Plus, Trash2, Search, Ruler, Save, GripVertical, DollarSign, X, 
  PlusCircle, MinusCircle, Copy, ArrowUp, ArrowDown, PlusSquare, Barcode, 
  Maximize2, RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';
import { BarcodeVisual } from './boq/BarcodeVisual';
import { MeasurementPortal } from './MeasurementPortal';
import { SpecificationPortal, SpecificationSavePayload } from './SpecificationPortal';
import { ConfirmationModal } from './ConfirmationModal';
import { BOQItemFullScreenModal } from './boq/BOQItemFullScreenModal';
import { BOQItem, MeasurementSheet, ItemSpecification, ItemCharge, ItemCategory } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useQuoteData } from '../hooks/useQuoteData';
import { computeItemNumber, syncItemsHierarchyNumbers } from '../lib/utils';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const AutoExpandingInput: React.FC<{
  value: string | number;
  onChange: (val: string) => void;
  type?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  isTransparent?: boolean;
  min?: number;
  max?: number;
}> = ({ value, onChange, type = "text", className, placeholder, disabled, isTransparent, min, max }) => {
  const content = value.toString();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (type === 'number') {
      if (val === '') {
        onChange('0');
        return;
      }
      
      const numVal = parseFloat(val);
      if (isNaN(numVal)) return;
      
      if (min !== undefined && numVal < min) return;
      if (max !== undefined && numVal > max) return;
      if (numVal < 0) return;
    }
    onChange(val);
  };

  return (
    <div className="relative inline-block min-w-[40px] w-full">
      <div className={cn(
        "invisible whitespace-pre text-[11px] font-bold border border-transparent",
        isTransparent ? "p-0" : "px-1 py-0.5",
        className
      )}>
        {content || placeholder || "0"}
      </div>
      <input
        type={type}
        value={value ?? ''}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step="any"
        className={cn(
          "absolute inset-0 w-full h-full text-[11px] font-bold transition-all focus:ring-0",
          isTransparent ? "bg-transparent border-none p-0" : "bg-slate-50 border border-slate-200 rounded-md px-1 py-0.5 focus:ring-1 focus:ring-blue-600",
          className
        )}
      />
    </div>
  );
};

interface ItemChargesPortalProps {
  item: BOQItem;
  onSave: (charges: ItemCharge[]) => void;
  onClose: () => void;
}

const ItemChargesPortal: React.FC<ItemChargesPortalProps> = ({ item, onSave, onClose }) => {
  const [charges, setCharges] = useState<ItemCharge[]>(item.itemCharges || []);

  const addCharge = () => {
    const newCharge: ItemCharge = {
      id: crypto.randomUUID(),
      name: '',
      amount: 0,
      isInclusive: false
    };
    setCharges([...charges, newCharge]);
  };

  const updateCharge = (id: string, updates: Partial<ItemCharge>) => {
    setCharges(charges.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeCharge = (id: string) => {
    setCharges(charges.filter(c => c.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-3 w-full max-w-md shadow-2xl border border-slate-200"
      >
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-sm font-bold tracking-tight">Additional Item Charges</h3>
            <p className="text-[9px] font-bold text-slate-400 tracking-wide">For: {item.name}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-md text-slate-400">
            <X size={14} />
          </button>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {charges.map((charge) => (
            <div key={charge.id} className="flex gap-2 items-start bg-slate-50 p-2 rounded-md border border-slate-100">
              <div className="flex-1 space-y-1.5">
                <input
                  type="text"
                  value={charge.name ?? ''}
                  onChange={(e) => updateCharge(charge.id, { name: e.target.value })}
                  placeholder="Charge Name (e.g. Scaffolding)"
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[10px] font-bold focus:ring-1 focus:ring-blue-600"
                />
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">Amt</span>
                    <input
                      type="number"
                      value={charge.amount ?? 0}
                      onChange={(e) => updateCharge(charge.id, { amount: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-200 rounded pl-8 pr-2 py-1 text-[10px] font-bold focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={charge.isInclusive}
                      onChange={(e) => updateCharge(charge.id, { isInclusive: e.target.checked })}
                      className="w-3 h-3 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-600"
                    />
                    <span className="text-[9px] font-bold text-slate-500 tracking-wide group-hover:text-slate-900 transition-colors">Inclusive</span>
                  </label>
                </div>
              </div>
              <button
                onClick={() => removeCharge(charge.id)}
                className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}

          {charges.length === 0 && (
            <div className="py-6 text-center border-2 border-dashed border-slate-100 rounded-lg">
              <DollarSign size={20} className="mx-auto text-slate-200 mb-1" />
              <p className="text-slate-400 font-bold text-[10px] tracking-wide">No additional charges added</p>
            </div>
          )}
        </div>

        <button
          onClick={addCharge}
          className="w-full mt-3 py-1.5 border border-dashed border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-[10px] font-bold tracking-wide"
        >
          <Plus size={12} /> Add Charge
        </button>

        <div className="flex gap-2 mt-3">
          <button
            onClick={onClose}
            className="flex-1 py-1.5 bg-slate-100 text-slate-900 rounded-md font-bold tracking-wide text-[9px] hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(charges)}
            className="flex-1 py-1.5 bg-blue-600 text-white rounded-md font-bold tracking-wide text-[9px] hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            Save Charges
          </button>
        </div>
      </motion.div>
    </div>
  );
};

interface BOQTableProps {
  items: BOQItem[];
  currency: string;
  onChange: (items: BOQItem[]) => void;
  onAddItem: (type?: 'Title' | 'Main' | 'Sub') => void;
  onOpenCatalog: () => void;
  onSaveAsTemplate?: (item: BOQItem) => void;
  isVariationMode?: boolean;
  onToggleOmit?: (id: string) => void;
  onMoveItem?: (id: string, direction: 'up' | 'down') => void;
  onDeleteItem?: (id: string) => void;
  onDuplicateItem?: (id: string) => void;
  onInsertItem?: (type: 'Title' | 'Main' | 'Sub', index: number) => void;
  onGeneratePVC?: (item: BOQItem) => string;
}

interface SortableRowProps {
  item: BOQItem;
  index: number;
  items: BOQItem[];
  currency: string;
  categories?: ItemCategory[];
  units: string[];
  updateItem: (id: string, field: keyof BOQItem, value: any) => void;
  updateItemType: (id: string, newType: 'Title' | 'Main' | 'Sub') => void;
  onOpenFullScreen: (item: BOQItem, index: number) => void;
  onSaveNewCategory: (name: string) => void;
  onSaveNewUnit: (name: string) => void;
  setActiveMeasurementItem: (item: BOQItem) => void;
  setActiveSpecItem: (item: BOQItem) => void;
  setActiveChargesItem: (item: BOQItem) => void;
  onSaveAsTemplate?: (item: BOQItem) => void;
  getItemNumber: (index: number) => string;
  isVariationMode?: boolean;
  onToggleOmit?: (id: string) => void;
  onMove?: (direction: 'up' | 'down') => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onInsert?: (type: 'Title' | 'Main' | 'Sub') => void;
  onGeneratePVC?: () => void;
}

const SortableRow: React.FC<SortableRowProps> = ({
  item,
  index,
  items,
  currency: _currency,
  categories,
  units,
  updateItem,
  updateItemType,
  onOpenFullScreen,
  onSaveNewCategory,
  onSaveNewUnit,
  setActiveMeasurementItem,
  setActiveSpecItem,
  setActiveChargesItem: _setActiveChargesItem,
  onSaveAsTemplate,
  getItemNumber,
  isVariationMode,
  onToggleOmit,
  onMove,
  onDelete,
  onDuplicate,
  onInsert,
  onGeneratePVC
}) => {
  const [showInsertMenu, setShowInsertMenu] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    position: isDragging ? 'relative' as const : 'static' as const,
  };

  const isTitle = item.itemType === 'Title';
  const isSub = item.itemType === 'Sub';
  const isOmitted = item.variationStatus === 'Omitted';

  return (
    <motion.tr
      ref={setNodeRef}
      style={style}
      layout="position"
      initial={{ opacity: 0, y: 12 }}
      animate={{ 
        opacity: isOmitted ? 0.5 : 1, 
        y: 0,
        transition: {
          type: "spring",
          stiffness: 450,
          damping: 30,
          delay: Math.min(index * 0.02, 0.2)
        }
      }}
      exit={{ 
        opacity: 0, 
        y: -12, 
        scale: 0.98,
        transition: {
          duration: 0.15
        }
      }}
      className={cn(
        "group transition-all",
        isDragging ? "bg-blue-50/50 shadow-lg ring-1 ring-blue-200" : "",
        isTitle ? "opacity-100" : "",
        isOmitted && "opacity-50 grayscale bg-slate-50"
      )}
    >
      <td className={cn(
        "px-2 py-1.5 rounded-l-lg text-[10px] font-bold transition-all flex items-center gap-1",
        isTitle ? "bg-blue-900 text-blue-200" : "bg-white text-slate-600 border-y border-l border-slate-200"
      )}>
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-slate-100 rounded-sm transition-colors text-slate-400"
          title="Drag to reorder"
        >
          <GripVertical size={10} />
        </button>
        <input
          type="text"
          value={item.no || getItemNumber(index)}
          onChange={(e) => {
            updateItem(item.id, 'no', e.target.value);
            updateItem(item.id, 'hasCustomNo', true);
          }}
          className={cn(
            "w-12 font-mono text-[9px] font-bold px-1 py-0.5 rounded border text-center focus:ring-1 focus:outline-hidden transition-all",
            isTitle
              ? "bg-blue-950/70 border-blue-700/60 text-blue-100 placeholder:text-blue-300 focus:ring-blue-400"
              : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-white focus:bg-white focus:ring-blue-500"
          )}
          title="Item number (Editable manually; re-sequences automatically when moved)"
        />
        <select
          value={item.itemType}
          onChange={(e) => updateItemType(item.id, e.target.value as 'Title' | 'Main' | 'Sub')}
          className={cn(
            "text-[8px] font-extrabold px-1 py-0.5 rounded border uppercase tracking-wider transition-all cursor-pointer focus:outline-hidden",
            isTitle ? "bg-amber-400 text-amber-950 border-amber-500" :
            isSub ? "bg-slate-100 text-slate-600 border-slate-300" :
            "bg-blue-50 text-blue-700 border-blue-200"
          )}
          title="Item Type: Title / Main / Sub (Changing type updates order & numbering)"
        >
          <option value="Title">Title</option>
          <option value="Main">Main</option>
          <option value="Sub">Sub</option>
        </select>
      </td>
      <td className={cn(
        "px-2 py-1.5 space-y-1 min-w-[220px] transition-all",
        isTitle ? "bg-blue-900" : "bg-white border-y border-slate-200",
        isSub ? "pl-5 bg-slate-50/50" : ""
      )}>
        <div className="flex items-center gap-1.5">
          {isSub && <span className="text-slate-400 font-bold text-[9px]">└─</span>}
          {isVariationMode && item.variationStatus && (
            <span className={cn(
              "px-1 py-0.5 rounded text-[7px] font-bold tracking-wide",
              item.variationStatus === 'Original' ? "bg-slate-100 text-slate-500" :
              item.variationStatus === 'Additional' ? "bg-emerald-100 text-emerald-600" :
              "bg-rose-100 text-rose-600"
            )}>
              {item.variationStatus}
            </span>
          )}
          <AutoExpandingInput
            value={item.name ?? ''}
            onChange={(val) => updateItem(item.id, 'name', val)}
            placeholder={isTitle ? "Section Title (e.g. 1.0 PRELIMINARIES)" : "Item Name"}
            isTransparent
            className={cn(
              "transition-all min-w-[120px]",
              isTitle ? "text-[12px] font-bold text-white placeholder:text-blue-300 uppercase tracking-wide" : "text-[11px] font-bold text-slate-900 placeholder:text-slate-300",
              isOmitted && "line-through"
            )}
            disabled={isOmitted}
          />
          {!isTitle && (
            <div className="flex gap-1.5 items-center ml-1 flex-wrap">
              {(item.variantBarcode || item.barcode) ? (
                <button
                  type="button"
                  onClick={() => setActiveSpecItem(item)}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-mono text-[9px] font-bold transition-all shadow-2xs group/bcode cursor-pointer"
                  title={`Exact Scannable Variant Barcode: ${item.variantBarcode || item.barcode} (Click to open Product Portal technical details & variant features)`}
                >
                  <Barcode size={12} className="text-amber-600 group-hover/bcode:scale-110 transition-transform" />
                  <span>{item.variantBarcode || item.barcode}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveSpecItem(item)}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50/70 hover:bg-amber-100 text-amber-800 border border-dashed border-amber-300 font-mono text-[9px] font-bold transition-all cursor-pointer"
                  title="Assign Exact Scannable Variant Barcode & Technical Specs"
                >
                  <Barcode size={11} className="text-amber-600" />
                  <span>+ Set Barcode</span>
                </button>
              )}
              {item.variantCode && item.variantCode !== (item.variantBarcode || item.barcode) && (
                <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 font-mono text-[8px] font-bold border border-amber-200">
                  {item.variantCode}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Single-line description with Full Screen button */}
        {!isTitle && (
          <div className="flex items-center gap-1.5 w-full">
            <input
              type="text"
              value={item.description ?? ''}
              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
              placeholder="Item description (click Full View to view & edit multi-line details)..."
              className={cn(
                "flex-1 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded px-1.5 py-0.5 text-[9px] font-medium text-slate-600 placeholder:text-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-hidden truncate h-6 transition-all",
                isOmitted && "line-through"
              )}
              disabled={isOmitted}
              title={item.description || "Single-line description"}
            />
            <button
              type="button"
              onClick={() => onOpenFullScreen(item, index)}
              className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 rounded border border-slate-200 text-[8px] font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer shadow-2xs"
              title="Full Screen View (View all multi-line details, specs, charges, and edit fitting full screen)"
            >
              <Maximize2 size={9} />
              <span className="hidden sm:inline">Full View</span>
            </button>
          </div>
        )}
      </td>
      
      {!isTitle && (
        <td className="w-16 px-1 py-1 bg-white border-y border-slate-200">
          {item.pvcCode ? (
            <div className="flex flex-col items-center gap-0.5 group/pvc">
              <div className="p-0.5 bg-white border border-slate-200 rounded shadow-xs group-hover/pvc:scale-[1.8] transition-transform origin-center bg-white z-20">
                <BarcodeVisual 
                  value={item.pvcCode} 
                  format="CODE128"
                  width={1.0}
                  height={18}
                  displayValue={false}
                />
              </div>
              <span className="text-[6px] font-mono font-bold text-slate-500 tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                {item.pvcCode}
              </span>
            </div>
          ) : (
             <button 
              onClick={onGeneratePVC}
              className="w-full flex flex-col items-center gap-0.5 group/gen opacity-40 hover:opacity-100 transition-opacity"
             >
                <div className="w-8 h-8 rounded border border-dashed border-slate-300 flex items-center justify-center bg-slate-50 group-hover/gen:border-blue-300 group-hover/gen:bg-blue-50 transition-colors">
                  <Plus size={10} className="text-slate-400 group-hover/gen:text-blue-500" />
                </div>
                <span className="text-[5px] font-black text-slate-400 uppercase tracking-tighter">GEN PVC</span>
             </button>
          )}
        </td>
      )}
      
      {isTitle ? (
        <td colSpan={8} className="bg-blue-900 px-2 py-2">
          <div className="h-full flex items-center">
            <div className="h-px w-full bg-blue-800" />
          </div>
        </td>
      ) : (
        <>
          <td className="px-1 py-1 bg-white border-y border-slate-200">
            <div className="relative group/cat">
              <input
                type="text"
                list={`categories-list-${item.id}`}
                value={item.category ?? 'Aluminium'}
                onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[9px] font-bold focus:ring-1 focus:ring-amber-500 focus:bg-white transition-all text-slate-800"
                placeholder="Category"
              />
              <datalist id={`categories-list-${item.id}`}>
                {categories && categories.map(c => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
              {item.category && categories && !categories.some(c => c.name.toLowerCase() === item.category.toLowerCase()) && (
                <button
                  type="button"
                  onClick={() => onSaveNewCategory(item.category)}
                  className="absolute -top-3 right-0 bg-amber-600 hover:bg-amber-700 text-white text-[7px] font-black px-1.5 py-0.2 rounded-xs shadow-xs transition-all cursor-pointer whitespace-nowrap z-10"
                  title="Save new category to system registry"
                >
                  + Save
                </button>
              )}
            </div>
          </td>
          <td className="px-1 py-1 bg-white border-y border-slate-200">
            <div className="relative group/unit">
              <input
                type="text"
                list={`units-list-${item.id}`}
                value={item.unit ?? 'sqft'}
                onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-[9px] font-bold focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all text-center text-slate-800"
                placeholder="Unit"
              />
              <datalist id={`units-list-${item.id}`}>
                {units.map(u => (
                  <option key={u} value={u} />
                ))}
              </datalist>
              {item.unit && !units.includes(item.unit) && (
                <button
                  type="button"
                  onClick={() => onSaveNewUnit(item.unit)}
                  className="absolute -top-3 right-0 bg-blue-600 hover:bg-blue-700 text-white text-[7px] font-black px-1.5 py-0.2 rounded-xs shadow-xs transition-all cursor-pointer whitespace-nowrap z-10"
                  title="Save new unit to system registry"
                >
                  + Save
                </button>
              )}
            </div>
          </td>
          <td className="px-1 py-1 bg-white border-y border-slate-200">
            <div className="flex flex-col gap-0.5">
              <div className="relative group/qty">
                <AutoExpandingInput
                  type="number"
                  value={item.qty ?? 0}
                  onChange={(val) => updateItem(item.id, 'qty', parseFloat(val) || 0)}
                  disabled={isOmitted || !!item.measurements || item.unit === 'Note' || item.unit === 'None' || (item.itemType === 'Main' && items.some((sub, i) => i > index && sub.itemType === 'Sub' && items.slice(index + 1, i).every(mid => mid.itemType === 'Sub')))}
                  min={0}
                  className={cn(
                    "text-[10px]",
                    (isOmitted || !!item.measurements || item.unit === 'Note' || item.unit === 'None' || item.itemType === 'Main') ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''
                  )}
                />
                {(isOmitted || item.measurements || item.unit === 'Note' || item.unit === 'None' || item.itemType === 'Main') && (
                  <div className="absolute -top-4 left-0 bg-blue-900 text-white text-[5px] px-1 py-0.5 rounded-sm font-bold tracking-wide opacity-0 group-hover/qty:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {isOmitted ? 'Locked (Omitted)' : item.unit === 'Note' ? 'N/A for Note' : item.unit === 'None' ? 'N/A for None' : item.itemType === 'Main' ? 'Calculated from Subs' : 'Locked by Sheet'}
                  </div>
                )}
              </div>
              {item.unit !== 'Note' && item.unit !== 'None' && (
                <button
                  onClick={() => setActiveMeasurementItem(item)}
                  className={`flex items-center justify-center gap-1 px-1 py-0.5 rounded text-[5px] font-bold tracking-wide transition-all ${
                    item.measurements 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100' 
                      : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <Ruler size={5} />
                  {item.measurements ? 'Sheet' : 'Add Sheet'}
                </button>
              )}
            </div>
          </td>
          <td className="px-1 py-1 bg-white border-y border-slate-200">
            {item.unit !== 'Note' && (
              <div className="relative group/rate">
                <AutoExpandingInput
                  type="number"
                  value={item.rate ?? 0}
                  onChange={(val) => updateItem(item.id, 'rate', parseFloat(val) || 0)}
                  min={0}
                  disabled={isOmitted || (item.itemType === 'Main' && items.some((sub, i) => i > index && sub.itemType === 'Sub' && items.slice(index + 1, i).every(mid => mid.itemType === 'Sub')))}
                  className={cn("text-[10px]", (isOmitted || (item.itemType === 'Main' && items.some((sub, i) => i > index && sub.itemType === 'Sub' && items.slice(index + 1, i).every(mid => mid.itemType === 'Sub')))) ? 'bg-slate-100 text-slate-400' : '')}
                />
                {(isOmitted || (item.itemType === 'Main' && items.some((sub, i) => i > index && sub.itemType === 'Sub' && items.slice(index + 1, i).every(mid => mid.itemType === 'Sub')))) && (
                  <div className="absolute -top-4 left-0 bg-blue-900 text-white text-[5px] px-1 py-0.5 rounded-sm font-bold tracking-wide opacity-0 group-hover/rate:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {isOmitted ? 'Locked (Omitted)' : item.itemType === 'Main' ? 'Calculated from Subs' : 'Total Amount'}
                  </div>
                )}
              </div>
            )}
          </td>
          <td className="px-1 py-1 bg-white border-y border-slate-200">
            {item.unit !== 'Note' && item.unit !== 'None' && (
              <AutoExpandingInput
                type="number"
                value={item.discountPercent ?? 0}
                onChange={(val) => updateItem(item.id, 'discountPercent', parseFloat(val) || 0)}
                min={0}
                max={100}
                className="text-[10px]"
              />
            )}
          </td>
          <td className="px-1 py-1 bg-white border-y border-slate-200 text-right">
            {item.unit !== 'Note' && (
              <span className="text-[11px] font-mono font-bold text-slate-900">
                {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            )}
          </td>
        </>
      )}

      <td className={cn(
        "px-1.5 py-1.5 rounded-r-lg transition-all",
        isTitle ? "bg-blue-900" : "bg-white border-y border-r border-slate-200"
      )}>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
          {/* Move Controls */}
          <div className="flex flex-col gap-0.5 mr-1">
            <button
              onClick={() => onMove?.('up')}
              disabled={index === 0}
              className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-30"
              title="Move Up"
            >
              <ArrowUp size={8} />
            </button>
            <button
              onClick={() => onMove?.('down')}
              disabled={index === items.length - 1}
              className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-30"
              title="Move Down"
            >
              <ArrowDown size={8} />
            </button>
          </div>

          {isVariationMode && onToggleOmit && item.variationStatus !== 'Additional' ? (
            <button
              onClick={() => onToggleOmit(item.id)}
              className={cn(
                "p-1 rounded-lg transition-all",
                isOmitted ? "text-emerald-600 hover:bg-emerald-50" : "text-rose-600 hover:bg-rose-50"
              )}
              title={isOmitted ? "Restore Item" : "Omit Item"}
            >
              {isOmitted ? <PlusCircle size={12} /> : <MinusCircle size={12} />}
            </button>
          ) : (
            <>
              {/* Insert Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowInsertMenu(!showInsertMenu)}
                  title="Insert Item After"
                  className="p-1 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                >
                  <PlusSquare size={10} />
                </button>
                {showInsertMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-[100] py-1 min-w-[80px]">
                    <button
                      onClick={() => { onInsert?.('Title'); setShowInsertMenu(false); }}
                      className="w-full text-left px-2 py-1 text-[8px] font-bold tracking-widest hover:bg-slate-50 text-slate-600"
                    >
                      + Title
                    </button>
                    <button
                      onClick={() => { onInsert?.('Main'); setShowInsertMenu(false); }}
                      className="w-full text-left px-2 py-1 text-[8px] font-bold tracking-widest hover:bg-slate-50 text-slate-600"
                    >
                      + Main
                    </button>
                    <button
                      onClick={() => { onInsert?.('Sub'); setShowInsertMenu(false); }}
                      className="w-full text-left px-2 py-1 text-[8px] font-bold tracking-widest hover:bg-slate-50 text-slate-600"
                    >
                      + Sub
                    </button>
                  </div>
                )}
              </div>

              {/* Duplicate */}
              <button
                onClick={onDuplicate}
                title="Duplicate Item"
                className="p-1 text-slate-300 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
              >
                <Copy size={10} />
              </button>

              {!isTitle && onSaveAsTemplate && (
                <button
                  onClick={() => onSaveAsTemplate(item)}
                  title="Save as Template"
                  className="p-1 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                >
                  <Save size={10} />
                </button>
              )}

              {/* Delete */}
              <button
                onClick={onDelete}
                title="Delete Item"
                className={cn(
                  "p-1 rounded-lg transition-all",
                  isTitle ? "text-slate-600 hover:text-red-400 hover:bg-slate-800" : "text-slate-300 hover:text-red-500 hover:bg-red-50"
                )}
              >
                <Trash2 size={10} />
              </button>
            </>
          )}
        </div>
      </td>
    </motion.tr>
  );
};

export const BOQTable: React.FC<BOQTableProps> = ({ 
  items, 
  currency, 
  onChange, 
  onAddItem, 
  onOpenCatalog, 
  onSaveAsTemplate,
  isVariationMode = false,
  onToggleOmit,
  onMoveItem,
  onDeleteItem,
  onDuplicateItem,
  onInsertItem,
  onGeneratePVC
}) => {
  const { itemCategories, itemTemplates, productVariants, saveItemCategory } = useQuoteData();
  const [activeMeasurementItem, setActiveMeasurementItem] = useState<BOQItem | null>(null);
  const [activeSpecItem, setActiveSpecItem] = useState<BOQItem | null>(null);
  const [activeChargesItem, setActiveChargesItem] = useState<BOQItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [fullScreenItemIndex, setFullScreenItemIndex] = useState<number | null>(null);

  const DEFAULT_UNITS = useMemo(() => [
    'm', 'ft', 'in', 'mm', 'm2', 'm²', 'sqft', 'm3', 'm³', 'kg', 'Tons', 'Nos', 'Set', 'Note', 'None', 'Visit', 'Hour', 'Day', 'Lot'
  ], []);

  const [customUnits, setCustomUnits] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('innovista_custom_units');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const allUnits = useMemo(() => {
    return Array.from(new Set([...DEFAULT_UNITS, ...customUnits]));
  }, [DEFAULT_UNITS, customUnits]);

  const handleSaveNewUnit = (newUnit: string) => {
    if (!newUnit || !newUnit.trim()) return;
    const trimmed = newUnit.trim();
    if (allUnits.includes(trimmed)) return;
    const updated = [...customUnits, trimmed];
    setCustomUnits(updated);
    try {
      localStorage.setItem('innovista_custom_units', JSON.stringify(updated));
    } catch {}
    toast.success(`Unit "${trimmed}" added to unit type registry!`);
  };

  const handleSaveNewCategory = (newCat: string) => {
    if (!newCat || !newCat.trim()) return;
    const trimmed = newCat.trim();
    if (itemCategories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) return;
    const newCategory: ItemCategory = {
      id: `cat-custom-${crypto.randomUUID().slice(0, 8)}`,
      name: trimmed,
      parentId: null,
      color: '#0284c7',
      tags: ['Custom Category'],
      displayTile: true,
      order: (itemCategories.length || 0) + 1
    };
    saveItemCategory(newCategory);
    toast.success(`Category "${trimmed}" saved to master category registry!`);
  };

  const updateItemType = (id: string, newType: 'Title' | 'Main' | 'Sub') => {
    let updated = items.map(item => {
      if (item.id === id) {
        if (newType === 'Title') {
          return {
            ...item,
            itemType: newType,
            unit: 'None' as const,
            qty: 0,
            rate: 0,
            discountPercent: 0,
            amount: 0
          };
        } else {
          return {
            ...item,
            itemType: newType,
            unit: (item.unit === 'None' || !item.unit) ? 'sqft' : item.unit,
            qty: (item.qty === 0 || !item.qty) ? 1 : item.qty
          };
        }
      }
      return item;
    });

    // Auto re-sequence numbers so order follows
    updated = syncItemsHierarchyNumbers(updated, false);
    const finalItems = updated.map(item => ({
      ...item,
      amount: calculateItemAmount(item, updated)
    }));
    onChange(finalItems);
  };

  const handleAutoRenumber = () => {
    const renumbered = syncItemsHierarchyNumbers(items, true);
    const finalItems = renumbered.map(item => ({
      ...item,
      amount: calculateItemAmount(item, renumbered)
    }));
    onChange(finalItems);
    toast.success('Hierarchical item numbers synchronized (1.0, 1.1, 1.1.1)');
  };

  const deleteItem = (id: string) => {
    setItemToDelete(id);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    
    if (onDeleteItem) {
      onDeleteItem(itemToDelete);
    } else {
      const remaining = items.filter(item => item.id !== itemToDelete);
      const renumbered = syncItemsHierarchyNumbers(remaining, false);
      const finalItems = renumbered.map(item => ({
        ...item,
        amount: calculateItemAmount(item, renumbered)
      }));
      onChange(finalItems);
    }
    setItemToDelete(null);
  };

  const duplicateItem = (id: string) => {
    if (onDuplicateItem) {
      onDuplicateItem(id);
    } else {
      const index = items.findIndex(item => item.id === id);
      if (index === -1) return;
      
      const item = items[index];
      const newItem = { 
        ...item, 
        id: crypto.randomUUID(),
        hasCustomNo: false,
        measurements: item.measurements ? { ...item.measurements, id: crypto.randomUUID() } : undefined,
        itemCharges: item.itemCharges?.map(c => ({ ...c, id: crypto.randomUUID() })),
        specification: item.specification ? JSON.parse(JSON.stringify(item.specification)) : undefined
      };
      
      const newItems = [...items];
      newItems.splice(index + 1, 0, newItem);
      const renumbered = syncItemsHierarchyNumbers(newItems, false);
      const finalItems = renumbered.map(it => ({
        ...it,
        amount: calculateItemAmount(it, renumbered)
      }));
      onChange(finalItems);
    }
  };

  const insertItem = (type: 'Title' | 'Main' | 'Sub', index: number) => {
    if (onInsertItem) {
      onInsertItem(type, index);
    } else {
      const newItem: BOQItem = {
        id: crypto.randomUUID(),
        no: '',
        name: '',
        description: '',
        itemType: type,
        category: 'Aluminium',
        unit: type === 'Title' ? 'None' : 'sqft',
        qty: type === 'Title' ? 0 : 1,
        rate: 0,
        discountPercent: 0,
        amount: 0
      };
      
      const newItems = [...items];
      newItems.splice(index + 1, 0, newItem);
      const renumbered = syncItemsHierarchyNumbers(newItems, false);
      const finalItems = renumbered.map(it => ({
        ...it,
        amount: calculateItemAmount(it, renumbered)
      }));
      onChange(finalItems);
    }
  };

  const moveItem = (id: string, direction: 'up' | 'down') => {
    if (onMoveItem) {
      onMoveItem(id, direction);
    } else {
      const index = items.findIndex(item => item.id === id);
      if (index === -1) return;
      if (direction === 'up' && index === 0) return;
      if (direction === 'down' && index === items.length - 1) return;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      const newItems = [...items];
      const [movedItem] = newItems.splice(index, 1);
      newItems.splice(newIndex, 0, movedItem);
      
      // Hierarchy numbers change when position changes
      const renumbered = syncItemsHierarchyNumbers(newItems, false);
      const finalItems = renumbered.map(it => ({
        ...it,
        amount: calculateItemAmount(it, renumbered)
      }));
      onChange(finalItems);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const calculateItemAmount = (item: BOQItem, allItems: BOQItem[]) => {
    if (item.unit === 'Note') return 0;
    
    let baseAmount = 0;
    if (item.itemType === 'Main') {
      // Find all sub-items belonging to this main item
      const itemIndex = allItems.findIndex(i => i.id === item.id);
      const subItems: BOQItem[] = [];
      for (let i = itemIndex + 1; i < allItems.length; i++) {
        if (allItems[i].itemType === 'Main' || allItems[i].itemType === 'Title') break;
        if (allItems[i].itemType === 'Sub') subItems.push(allItems[i]);
      }

      if (subItems.length > 0) {
        baseAmount = subItems.reduce((sum, sub) => sum + sub.amount, 0);
      } else {
        const qty = item.measurements ? item.measurements.totalQuantity : item.qty;
        const subtotal = qty * item.rate;
        const discount = subtotal * (item.discountPercent / 100);
        baseAmount = subtotal - discount;
      }
    } else if (item.unit === 'None') {
      baseAmount = item.rate; // Treat rate as the total amount for 'None'
    } else {
      const qty = item.measurements ? item.measurements.totalQuantity : item.qty;
      const subtotal = qty * item.rate;
      const discount = subtotal * (item.discountPercent / 100);
      baseAmount = subtotal - discount;
    }

    // Add exclusive charges
    const exclusiveCharges = item.itemCharges?.filter(c => !c.isInclusive).reduce((sum, c) => sum + c.amount, 0) || 0;
    
    return baseAmount + exclusiveCharges;
  };

  const updateItem = (id: string, field: keyof BOQItem, value: any) => {
    let newItems = items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });

    // Recalculate all amounts to handle main/sub relationships
    newItems = newItems.map(item => ({
      ...item,
      amount: calculateItemAmount(item, newItems)
    }));

    // Special case: Update main item qty if all sub items have same unit
    newItems = newItems.map((item, index) => {
      if (item.itemType === 'Main') {
        const subItems: BOQItem[] = [];
        for (let i = index + 1; i < newItems.length; i++) {
          if (newItems[i].itemType === 'Main' || newItems[i].itemType === 'Title') break;
          if (newItems[i].itemType === 'Sub') subItems.push(newItems[i]);
        }

        if (subItems.length > 0) {
          const firstUnit = subItems[0].unit;
          const allSameUnit = subItems.every(sub => sub.unit === firstUnit);
          if (allSameUnit && firstUnit !== 'Note') {
            const totalQty = subItems.reduce((sum, sub) => sum + sub.qty, 0);
            return { ...item, qty: totalQty, unit: firstUnit };
          }
        }
      }
      return item;
    });

    onChange(newItems);
  };

  const handleSaveMeasurements = (sheet: MeasurementSheet) => {
    if (!activeMeasurementItem) return;

    const newItems = items.map(item => {
      if (item.id === activeMeasurementItem.id) {
        return { 
          ...item, 
          measurements: sheet,
          qty: sheet.totalQuantity,
          calculations: `Measured: ${sheet.totalQuantity.toFixed(2)} ${item.unit} (${sheet.method})`
        };
      }
      return item;
    });

    // Recalculate all amounts
    const finalItems = newItems.map(item => ({
      ...item,
      amount: calculateItemAmount(item, newItems)
    }));

    onChange(finalItems);
    setActiveMeasurementItem(null);
  };

  const handleSaveSpec = (
    specOrPayload: ItemSpecification | SpecificationSavePayload,
    descriptionText?: string
  ) => {
    if (!activeSpecItem) return;

    const isPayload = specOrPayload && typeof specOrPayload === 'object' && ('variantBarcode' in specOrPayload || 'spec' in specOrPayload || 'variantAttributes' in specOrPayload);
    const payload = isPayload ? (specOrPayload as SpecificationSavePayload) : null;
    const finalSpec = payload?.spec || (isPayload ? undefined : (specOrPayload as ItemSpecification));
    const finalDesc = descriptionText || payload?.description || activeSpecItem.description;

    const newItems = items.map(item => {
      if (item.id === activeSpecItem.id) {
        const updatedRate = (payload?.rate !== undefined && payload.rate > 0) ? payload.rate : item.rate;
        const subtotal = item.qty * updatedRate;
        const discount = subtotal * ((item.discountPercent || 0) / 100);
        const exclusiveCharges = item.itemCharges?.filter(c => !c.isInclusive).reduce((sum, c) => sum + c.amount, 0) || 0;
        const updatedAmount = subtotal - discount + exclusiveCharges;

        const finalBarcode = payload?.variantBarcode || item.variantBarcode || item.barcode;

        return {
          ...item,
          name: payload?.name || item.name,
          specification: finalSpec || item.specification,
          description: finalDesc,
          variantBarcode: finalBarcode,
          barcode: finalBarcode,
          variantCode: payload?.variantCode || item.variantCode,
          productCode: payload?.productCode || item.productCode,
          category: payload?.category || item.category,
          rate: updatedRate,
          amount: updatedAmount,
          variantId: payload?.variantId || item.variantId,
          variantAttributes: payload?.variantAttributes || item.variantAttributes
        };
      }
      return item;
    });
    onChange(newItems);
    setActiveSpecItem(null);
  };

  const handleSaveCharges = (charges: ItemCharge[]) => {
    if (!activeChargesItem) return;

    const newItems = items.map(item => {
      if (item.id === activeChargesItem.id) {
        // Update description with charges if they exist
        let newDescription = item.description;
        const chargeText = charges.map(c => `${c.name}: ${c.amount.toLocaleString()} (${c.isInclusive ? 'Incl.' : 'Excl.'})`).join(', ');
        
        // Remove old charges text if it exists (simple heuristic)
        const chargesPrefix = '\nAdditional Charges: ';
        const existingChargesIndex = newDescription.indexOf(chargesPrefix);
        if (existingChargesIndex !== -1) {
          newDescription = newDescription.substring(0, existingChargesIndex);
        }
        
        if (charges.length > 0) {
          newDescription += `${chargesPrefix}${chargeText}`;
        }

        return { ...item, itemCharges: charges, description: newDescription };
      }
      return item;
    });

    // Recalculate all amounts
    const finalItems = newItems.map(item => ({
      ...item,
      amount: calculateItemAmount(item, newItems)
    }));

    onChange(finalItems);
    setActiveChargesItem(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      
      const newItems: BOQItem[] = arrayMove(items, oldIndex, newIndex);
      
      // Auto renumber on drag position change
      const renumbered = syncItemsHierarchyNumbers(newItems, false);
      const finalItems = renumbered.map((item: BOQItem) => ({
        ...item,
        amount: calculateItemAmount(item, renumbered)
      }));

      onChange(finalItems);
    }
  };

  const getItemNumber = (index: number) => {
    return computeItemNumber(items, index);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold tracking-tight text-slate-900">Bill of Quantities</h2>
          <p className="text-[9px] font-bold text-slate-400 tracking-widest">Itemized breakdown of works • Strict hierarchy (1.0 Title, 1.1 Main, 1.1.1 Sub)</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAutoRenumber}
            className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold tracking-widest text-[8px] transition-all border border-slate-200 cursor-pointer shadow-2xs"
            title="Auto-Renumber all items to 1.0, 1.1, 1.1.1 hierarchy"
          >
            <RefreshCw size={10} /> Renumber All
          </button>

          <button
            onClick={onOpenCatalog}
            className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-900 rounded-lg font-bold tracking-widest text-[8px] hover:bg-blue-600 hover:text-white transition-all border border-slate-200 cursor-pointer"
          >
            <Search size={10} /> Quick Insert
          </button>
          
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => onAddItem('Title')}
              className="px-2 py-0.5 hover:bg-white hover:shadow-sm rounded-md text-[8px] font-bold tracking-widest text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
            >
              + Title
            </button>
            <button
              onClick={() => onAddItem('Main')}
              className="px-2 py-0.5 bg-blue-600 text-white shadow-md shadow-blue-600/20 rounded-md text-[8px] font-bold tracking-widest transition-all cursor-pointer"
            >
              + Main
            </button>
            <button
              onClick={() => onAddItem('Sub')}
              className="px-2 py-0.5 hover:bg-white hover:shadow-sm rounded-md text-[8px] font-bold tracking-widest text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
            >
              + Sub
            </button>
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map(i => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full border-separate border-spacing-y-1.5">
              <thead>
                  <tr className="text-left">
                    <th className="w-28 px-2 py-1 text-[8px] font-bold text-slate-400 tracking-widest">No & Type</th>
                    <th className="px-2 py-1 text-[8px] font-bold text-slate-400 tracking-widest">Item Name & Description</th>
                    <th className="w-12 px-2 py-1 text-[8px] font-bold text-slate-400 tracking-widest text-center">PVC QR</th>
                    <th className="w-24 px-2 py-1 text-[8px] font-bold text-slate-400 tracking-widest">Category</th>
                    <th className="w-16 px-2 py-1 text-[8px] font-bold text-slate-400 tracking-widest">Unit</th>
                    <th className="w-16 px-2 py-1 text-[8px] font-bold text-slate-400 tracking-widest">Qty</th>
                    <th className="w-24 px-2 py-1 text-[8px] font-bold text-slate-400 tracking-widest">Rate ({currency})</th>
                    <th className="w-12 px-2 py-1 text-[8px] font-bold text-slate-400 tracking-widest">Disc%</th>
                    <th className="w-32 px-2 py-1 text-[8px] font-bold text-slate-400 tracking-widest text-right">Amount</th>
                    <th className="w-6 px-2 py-1"></th>
                  </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {items.map((item, index) => (
                    <SortableRow
                      key={item.id}
                      item={item}
                      index={index}
                      items={items}
                      currency={currency}
                      categories={itemCategories}
                      units={allUnits}
                      updateItem={updateItem}
                      updateItemType={updateItemType}
                      onOpenFullScreen={(_it, idx) => setFullScreenItemIndex(idx)}
                      onSaveNewCategory={handleSaveNewCategory}
                      onSaveNewUnit={handleSaveNewUnit}
                      onDelete={() => deleteItem(item.id)}
                      onDuplicate={() => duplicateItem(item.id)}
                      onInsert={(type) => insertItem(type, index)}
                      onMove={(dir) => moveItem(item.id, dir)}
                      setActiveMeasurementItem={setActiveMeasurementItem}
                      setActiveSpecItem={setActiveSpecItem}
                      setActiveChargesItem={setActiveChargesItem}
                      onSaveAsTemplate={onSaveAsTemplate}
                      getItemNumber={getItemNumber}
                      isVariationMode={isVariationMode}
                      onToggleOmit={onToggleOmit}
                      onGeneratePVC={() => {
                        if (onGeneratePVC) {
                          const code = onGeneratePVC(item);
                          updateItem(item.id, 'pvcCode', code);
                        }
                      }}
                    />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </SortableContext>
      </DndContext>

      {/* Full-Screen BOQ Item Inspector & Description Editor */}
      {fullScreenItemIndex !== null && items[fullScreenItemIndex] && (
        <BOQItemFullScreenModal
          item={items[fullScreenItemIndex]}
          itemIndex={fullScreenItemIndex}
          totalItems={items.length}
          categories={itemCategories}
          units={allUnits}
          onSaveItem={(updated) => {
            const newItems = items.map((it, idx) => idx === fullScreenItemIndex ? updated : it);
            const finalItems = newItems.map(it => ({
              ...it,
              amount: calculateItemAmount(it, newItems)
            }));
            onChange(finalItems);
          }}
          onClose={() => setFullScreenItemIndex(null)}
          onNavigate={(dir) => {
            if (dir === 'prev' && fullScreenItemIndex > 0) {
              setFullScreenItemIndex(fullScreenItemIndex - 1);
            } else if (dir === 'next' && fullScreenItemIndex < items.length - 1) {
              setFullScreenItemIndex(fullScreenItemIndex + 1);
            }
          }}
          onAddNewCategory={handleSaveNewCategory}
          onAddNewUnit={handleSaveNewUnit}
          onOpenSpecs={(item) => setActiveSpecItem(item)}
          onOpenMeasurements={(item) => setActiveMeasurementItem(item)}
          onOpenCharges={(item) => setActiveChargesItem(item)}
        />
      )}

      {activeMeasurementItem && (
        <MeasurementPortal
          item={activeMeasurementItem}
          onSave={handleSaveMeasurements}
          onClose={() => setActiveMeasurementItem(null)}
        />
      )}

      {activeSpecItem && (
        <SpecificationPortal
          item={activeSpecItem}
          onSave={handleSaveSpec}
          onClose={() => setActiveSpecItem(null)}
          categories={itemCategories}
          itemTemplates={itemTemplates}
          productVariants={productVariants}
        />
      )}

      {activeChargesItem && (
        <ItemChargesPortal
          item={activeChargesItem}
          onSave={handleSaveCharges}
          onClose={() => setActiveChargesItem(null)}
        />
      )}

      {itemToDelete && (
        <ConfirmationModal
          isOpen={!!itemToDelete}
          title="Delete Item"
          message={`Are you sure you want to delete "${items.find(i => i.id === itemToDelete)?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDelete}
          onClose={() => setItemToDelete(null)}
          type="danger"
        />
      )}
    </div>
  );
};
