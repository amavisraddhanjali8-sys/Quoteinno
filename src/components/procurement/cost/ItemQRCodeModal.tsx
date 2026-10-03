import React, { useState } from 'react';
import { 
  X, 
  Barcode, 
  Printer, 
  Copy, 
  Check
} from 'lucide-react';
import { getCostItemImageUrl, getCostItemFallbackSvg } from './costItemImages';
import { BarcodeVisual } from '../../boq/BarcodeVisual';

interface ItemQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    itemCode?: string;
    variantCode?: string;
    name: string;
    category?: string;
    parentItemCode?: string;
    parentCostItemId?: string;
    primaryUnit?: string;
    unit?: string;
    benchmarkCost?: number;
    standardCost?: number;
    currency?: string;
    imageUrl?: string;
  } | null;
}

export const ItemQRCodeModal: React.FC<ItemQRCodeModalProps> = ({
  isOpen,
  onClose,
  item
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !item) return null;

  const code = item.itemCode || item.variantCode || item.id;
  const isVariant = !!item.variantCode;
  const parentFk = item.parentItemCode || item.parentCostItemId;
  const unit = item.primaryUnit || item.unit || 'unit';
  const cost = item.benchmarkCost || item.standardCost || 0;
  const currency = item.currency || 'LKR';
  const imgUrl = getCostItemImageUrl({
    imageUrl: item.imageUrl,
    itemCode: item.itemCode,
    variantCode: item.variantCode,
    name: item.name,
    category: item.category
  });

  const payload = `${code} | ${item.name} | ${currency} ${cost}/${unit}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-500/20 text-orange-400 rounded-lg border border-orange-500/30">
              <Barcode size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm">Code 128 Barcode & Smart Tag</h3>
              <p className="text-[11px] text-slate-400">Inventory & Procurement Material Tracker</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 flex flex-col items-center text-center">
          {/* 1:1 Scale Image and Barcode Tag side-by-side or stacked */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
            {/* 1:1 Item Thumbnail */}
            <div className="w-24 h-24 aspect-square rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm shrink-0 bg-slate-100 relative group">
              <img 
                src={imgUrl} 
                alt={item.name}
                onError={(e) => {
                  e.currentTarget.src = getCostItemFallbackSvg(item.category, item.name);
                }}
                className="w-full h-full object-cover" 
              />
              <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/70 text-[9px] text-white font-mono rounded">
                1:1
              </span>
            </div>

            {/* High-Resolution Code 128 Barcode Matrix */}
            <div className="p-3 bg-white rounded-xl border-2 border-slate-900 shadow-sm flex flex-col items-center justify-center flex-1 max-w-[240px]">
              <BarcodeVisual
                value={code}
                format="CODE128"
                width={1.4}
                height={40}
                fontSize={10}
                displayValue={true}
              />
              <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider mt-1">
                Standard Code 128 Barcode
              </span>
            </div>
          </div>

          {/* Primary & Foreign Key Details */}
          <div className="w-full bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-2 text-left">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                PK: {code}
              </span>
              {parentFk ? (
                <span className="font-mono text-[11px] font-bold text-orange-800 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                  FK: {parentFk}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-mono">FK: Global Master</span>
              )}
            </div>

            <div className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2">
              {item.name}
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
              <span className="text-slate-500">{item.category || (isVariant ? 'Item Variant' : 'Cost Item')}</span>
              <span className="font-mono font-bold text-slate-900">
                {currency} {cost.toLocaleString()} <span className="font-normal text-slate-400">/{unit}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            <span>{copied ? 'Copied Barcode Data!' : 'Copy Barcode Data'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Printer size={13} />
              <span>Print Barcode Label</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ItemBarcodeModal = ItemQRCodeModal;

