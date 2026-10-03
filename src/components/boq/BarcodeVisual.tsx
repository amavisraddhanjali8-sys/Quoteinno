import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeVisualProps {
  value: string;
  format?: 'CODE128' | 'CODE39' | 'EAN13' | 'UPC';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
}

export const BarcodeVisual: React.FC<BarcodeVisualProps> = ({
  value,
  format = 'CODE128',
  width = 1.4,
  height = 36,
  displayValue = true,
  fontSize = 11,
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const cleanValue = (value || '').trim();
    if (!cleanValue) return;

    try {
      JsBarcode(svgRef.current, cleanValue, {
        format,
        width,
        height,
        displayValue,
        fontSize,
        textMargin: 3,
        font: 'monospace',
        fontOptions: 'bold',
        background: '#ffffff',
        lineColor: '#0f172a',
        margin: 4
      });
    } catch (err) {
      console.warn('JsBarcode render error with format', format, 'fallback to CODE128:', err);
      try {
        JsBarcode(svgRef.current, cleanValue, {
          format: 'CODE128',
          width,
          height,
          displayValue,
          fontSize,
          textMargin: 3,
          font: 'monospace',
          fontOptions: 'bold',
          background: '#ffffff',
          lineColor: '#0f172a',
          margin: 4
        });
      } catch (fallbackErr) {
        console.error('Barcode rendering failed completely:', fallbackErr);
      }
    }
  }, [value, format, width, height, displayValue, fontSize]);

  if (!value || !value.trim()) {
    return (
      <div className={`text-[10px] text-slate-400 italic bg-white p-2 border border-slate-200 rounded ${className}`}>
        No barcode value
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center bg-white ${className}`}>
      <svg ref={svgRef} className="max-w-full h-auto" />
    </div>
  );
};
