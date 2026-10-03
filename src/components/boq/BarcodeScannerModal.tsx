import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Camera, X, Barcode, Search, AlertCircle, 
  CheckCircle2, Plus, Sparkles, RefreshCw
} from 'lucide-react';
import { ItemTemplate } from '../../types';
import { BarcodeVisual } from './BarcodeVisual';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  allItems: ItemTemplate[];
  onSelectItem: (item: ItemTemplate) => void;
  onAddNewItemWithCode?: (code: string) => void;
}

// Sound feedback for successful barcode scan
const playScanSuccessBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); // A6 note
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.13);
  } catch (e) {
    console.debug('Web Audio not allowed or unavailable:', e);
  }
};

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  allItems,
  onSelectItem,
  onAddNewItemWithCode
}) => {
  const [activeTab, setActiveTab] = useState<'CAMERA' | 'MANUAL' | 'ITEMS_LIST'>('CAMERA');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [scannedResult, setScannedResult] = useState<{
    code: string;
    item?: ItemTemplate;
    timestamp: string;
  } | null>(null);
  const [barcodeSearchTerm, setBarcodeSearchTerm] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const hardwareBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  // Stop camera helper
  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Find item by code, productCode, barcode, pvcCode, or id
  const findItemByCode = (query: string): ItemTemplate | undefined => {
    const clean = query.trim().toLowerCase();
    if (!clean) return undefined;
    return allItems.find(item => {
      const code = (item.code || '').toLowerCase();
      const prodCode = (item.productCode || '').toLowerCase();
      const barcode = (item.barcode || '').toLowerCase();
      const pvc = (item.pvcCode || '').toLowerCase();
      const id = (item.id || '').toLowerCase();
      return code === clean || prodCode === clean || barcode === clean || pvc === clean || id === clean;
    });
  };

  // Handle successful scan match
  const handleBarcodeDetected = (code: string) => {
    const clean = code.trim();
    if (!clean) return;

    playScanSuccessBeep();
    const matchedItem = findItemByCode(clean);

    setScannedResult({
      code: clean,
      item: matchedItem,
      timestamp: new Date().toLocaleTimeString()
    });

    if (matchedItem) {
      setTimeout(() => {
        onSelectItem(matchedItem);
        stopCamera();
        onClose();
      }, 1000);
    }
  };

  // Start Camera and Barcode Detection
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera streaming API is not supported in this browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }

      // Check if native BarcodeDetector is supported
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code', 'upc_a', 'upc_e']
          });

          scanIntervalRef.current = window.setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes && barcodes.length > 0) {
                  const detectedValue = barcodes[0].rawValue;
                  if (detectedValue) {
                    handleBarcodeDetected(detectedValue);
                  }
                }
              } catch (e) {
                // Ignore frame-level detection slips
              }
            }
          }, 350);
        } catch (e) {
          console.debug('BarcodeDetector init error:', e);
        }
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(err.message || 'Could not start camera. Please check permissions or use manual code entry.');
      setIsCameraActive(false);
    }
  };

  // Hardware USB Barcode Scanner support (listens for keyboard events)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') {
        return;
      }

      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Scanners type fast (usually < 50ms per character)
      if (timeDiff > 250) {
        hardwareBufferRef.current = '';
      }

      if (e.key === 'Enter') {
        if (hardwareBufferRef.current.length >= 2) {
          const scanned = hardwareBufferRef.current.trim();
          hardwareBufferRef.current = '';
          handleBarcodeDetected(scanned);
        }
      } else if (e.key.length === 1) {
        hardwareBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, allItems]);

  // Manage camera on modal open/close or tab switch
  useEffect(() => {
    if (isOpen && activeTab === 'CAMERA') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Filtered items for quick selection tab
  const filteredItems = allItems.filter(item => {
    const q = barcodeSearchTerm.toLowerCase();
    return (
      (item.productCode || '').toLowerCase().includes(q) ||
      (item.code || '').toLowerCase().includes(q) ||
      (item.name || '').toLowerCase().includes(q) ||
      (item.barcode || '').toLowerCase().includes(q)
    );
  });

  const modalContent = (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-xl border border-orange-200/80">
              <Barcode size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Barcode & Item Code Scanner
              </h2>
              <p className="text-xs text-slate-500">
                Item Code is the Primary Key. Scan via camera, USB scanner, or manual entry.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-white border-b border-slate-100 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('CAMERA')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'CAMERA'
                ? 'border-orange-500 text-orange-600 bg-orange-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera size={14} />
            <span>Live Camera Scanner</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MANUAL')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'MANUAL'
                ? 'border-orange-500 text-orange-600 bg-orange-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Barcode size={14} />
            <span>Manual Code Entry</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ITEMS_LIST')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'ITEMS_LIST'
                ? 'border-orange-500 text-orange-600 bg-orange-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search size={14} />
            <span>Library Barcodes ({allItems.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-white space-y-4">
          {/* TAB 1: Live Camera Scanner */}
          {activeTab === 'CAMERA' && (
            <div className="space-y-4">
              <div className="relative aspect-video max-h-[320px] w-full bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-300 shadow-inner">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />

                {/* Viewfinder Target Box and Laser Scan Animation */}
                {isCameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-64 h-36 border-2 border-orange-400 rounded-lg relative overflow-hidden shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]">
                      {/* Laser Line */}
                      <div className="w-full h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse absolute top-1/2 -translate-y-1/2" />
                      {/* Corner Accents */}
                      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white" />
                      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white" />
                      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white" />
                    </div>
                  </div>
                )}

                {/* Fallback / Error State */}
                {cameraError && (
                  <div className="absolute inset-0 p-6 bg-slate-900/90 text-white flex flex-col items-center justify-center text-center space-y-2">
                    <AlertCircle size={28} className="text-amber-400" />
                    <p className="text-xs font-semibold text-slate-200 max-w-sm">{cameraError}</p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="mt-2 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw size={13} />
                      <span>Retry Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('MANUAL')}
                      className="text-xs text-orange-400 underline mt-1"
                    >
                      Switch to Manual Code Entry
                    </button>
                  </div>
                )}
              </div>

              {/* Hardware Scanner & Simulation Hint */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>
                    <strong>Hardware Scanner Active:</strong> Any USB or Bluetooth barcode scanner will automatically capture and match codes.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const sample = allItems[0]?.productCode || allItems[0]?.code || 'AL-SLD-1001';
                    handleBarcodeDetected(sample);
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg shrink-0 shadow-2xs"
                >
                  Simulate Scan
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Manual Code Entry */}
          {activeTab === 'MANUAL' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Enter Primary Key (Item Code) or Barcode Number
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Barcode size={16} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={manualCodeInput}
                      onChange={(e) => setManualCodeInput(e.target.value)}
                      placeholder="e.g., AL-SLD-1001, PV-XXXXX, B-12345678"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && manualCodeInput.trim()) {
                          handleBarcodeDetected(manualCodeInput.trim());
                        }
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (manualCodeInput.trim()) {
                        handleBarcodeDetected(manualCodeInput.trim());
                      }
                    }}
                    disabled={!manualCodeInput.trim()}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-xs"
                  >
                    Lookup & Select
                  </button>
                </div>
              </div>

              {/* Instant Suggestions */}
              {manualCodeInput.trim() && (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Matching Items:
                  </span>
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden max-h-48 overflow-y-auto">
                    {allItems
                      .filter(i => {
                        const q = manualCodeInput.toLowerCase();
                        return (
                          (i.productCode || '').toLowerCase().includes(q) ||
                          (i.code || '').toLowerCase().includes(q) ||
                          (i.name || '').toLowerCase().includes(q) ||
                          (i.barcode || '').toLowerCase().includes(q)
                        );
                      })
                      .slice(0, 5)
                      .map(item => (
                        <div
                          key={item.id}
                          onClick={() => handleBarcodeDetected(item.productCode || item.code || item.id)}
                          className="p-3 hover:bg-orange-50/60 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-orange-600">
                                {item.productCode || item.code || 'NO-CODE'}
                              </span>
                              <span className="text-xs font-semibold text-slate-800">{item.name}</span>
                            </div>
                            <span className="text-[11px] text-slate-400">{item.category} &bull; LKR {item.rate.toLocaleString()} / {item.unit}</span>
                          </div>
                          <span className="text-xs text-orange-600 font-semibold">Select &rarr;</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Library Barcodes Overview */}
          {activeTab === 'ITEMS_LIST' && (
            <div className="space-y-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={barcodeSearchTerm}
                  onChange={(e) => setBarcodeSearchTerm(e.target.value)}
                  placeholder="Search item by code, name or barcode..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-orange-400"
                />
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filteredItems.map(item => {
                  const code = item.productCode || item.code || item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleBarcodeDetected(code)}
                      className="p-3 bg-white border border-slate-200 hover:border-orange-300 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all hover:shadow-2xs group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 group-hover:bg-orange-50 text-slate-800 group-hover:text-orange-700 border border-slate-200">
                            PK: {code}
                          </span>
                          <span className="text-xs font-semibold text-slate-900 group-hover:text-orange-950">
                            {item.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate max-w-sm">
                          {item.category} &bull; {item.description || 'No description'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden sm:block">
                          <BarcodeVisual value={code} height={28} width={1.1} displayValue={false} />
                        </div>
                        <span className="text-xs font-bold text-orange-600 px-2 py-1 rounded bg-orange-50 border border-orange-200">
                          Select
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scanned Result Banner */}
          {scannedResult && (
            <div className={`p-4 rounded-xl border transition-all ${
              scannedResult.item
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                : 'bg-amber-50/70 border-amber-300 text-amber-950'
            }`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  {scannedResult.item ? (
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {scannedResult.item ? 'Item Identified!' : 'Code Not in Master Library'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        PK: {scannedResult.code}
                      </span>
                    </div>

                    {scannedResult.item ? (
                      <div className="mt-1">
                        <p className="text-xs font-bold text-emerald-900">{scannedResult.item.name}</p>
                        <p className="text-[11px] text-emerald-800">
                          {scannedResult.item.category} &bull; Base Rate: LKR {scannedResult.item.rate.toLocaleString()} / {scannedResult.item.unit}
                        </p>
                        <p className="text-[10px] text-emerald-700 mt-0.5">Loading into Specification Engine...</p>
                      </div>
                    ) : (
                      <div className="mt-1 space-y-2">
                        <p className="text-xs text-amber-900">
                          No existing BOQ item matched code &ldquo;{scannedResult.code}&rdquo;.
                        </p>
                        {onAddNewItemWithCode && (
                          <button
                            type="button"
                            onClick={() => {
                              onAddNewItemWithCode(scannedResult.code);
                              stopCamera();
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                          >
                            <Plus size={13} />
                            <span>Create New Item with Code &ldquo;{scannedResult.code}&rdquo;</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <span className="text-[10px] text-slate-400 shrink-0">
                  {scannedResult.timestamp}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1 text-[11px]">
            <Sparkles size={13} className="text-orange-500" />
            <span>Fast item selection using barcode scanner or primary key code.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
