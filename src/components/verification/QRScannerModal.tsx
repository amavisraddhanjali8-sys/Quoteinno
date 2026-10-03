import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Camera, Upload, AlertCircle, RefreshCw, 
  Sparkles, Image as ImageIcon, QrCode
} from 'lucide-react';
import jsQR from 'jsqr';

interface QRScannerModalProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ onScan, onClose }) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Start Camera Stream
  useEffect(() => {
    if (activeTab !== 'camera') {
      stopCamera();
      return;
    }

    let isMounted = true;

    async function startCamera() {
      try {
        setCameraError(null);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access is not supported by your browser or environment.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
        });

        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          requestAnimationFrame(scanVideoFrame);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.warn('Camera stream error:', err);
        setCameraError(
          err.name === 'NotAllowedError' 
            ? 'Camera permission denied. Please allow camera access in your browser settings, or use Image Upload / Demo QR below.'
            : err.message || 'Unable to access camera.'
        );
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [activeTab, facingMode]);

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const scanVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current || activeTab !== 'camera') return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code && code.data) {
        // Extract SVC or code from URL if contained
        const extracted = parseCodeFromScannedData(code.data);
        stopCamera();
        onScan(extracted);
        onClose();
        return;
      }
    }

    animationFrameId.current = requestAnimationFrame(scanVideoFrame);
  };

  const parseCodeFromScannedData = (data: string): string => {
    // If it's a URL like https://domain.com/verify?code=SV-XXXXX
    try {
      if (data.includes('code=')) {
        const url = new URL(data);
        const codeParam = url.searchParams.get('code');
        if (codeParam) return codeParam;
      }
    } catch {}
    return data.trim();
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            const extracted = parseCodeFromScannedData(code.data);
            onScan(extracted);
            onClose();
          } else {
            alert('No valid QR code could be detected in this image. Please ensure the code is clear and well-lit.');
          }
        }
        setIsProcessing(false);
      };
      img.onerror = () => {
        setIsProcessing(false);
        alert('Failed to load image file.');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <QrCode size={18} className="text-orange-400" />
            <h3 className="text-sm font-bold">Document QR & Barcode Scanner</h3>
          </div>
          <button 
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-100 bg-slate-50 p-1">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'camera' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera size={14} />
            Live Camera Scanner
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload size={14} />
            Upload Document Image
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {activeTab === 'camera' ? (
            <div className="space-y-4">
              {cameraError ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-3">
                  <AlertCircle size={28} className="text-rose-500 mx-auto" />
                  <div className="text-xs text-rose-800 font-medium">{cameraError}</div>
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors"
                    >
                      Switch to Image Upload
                    </button>
                    <button
                      onClick={() => {
                        onScan('SV-A7K2M-9P3XQ-4W8NR');
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-white border border-rose-300 text-rose-900 rounded-lg text-xs font-semibold hover:bg-rose-100 transition-colors"
                    >
                      Use Demo QR Code
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-square max-w-[320px] mx-auto bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover"
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Optical Reticle / Scanner Overlay */}
                  <div className="absolute inset-0 border-2 border-orange-500/40 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-orange-400 rounded-xl relative animate-pulse">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-orange-500 -mt-1 -ml-1" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-orange-500 -mt-1 -mr-1" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-orange-500 -mb-1 -ml-1" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-orange-500 -mb-1 -mr-1" />
                      {/* Laser Line */}
                      <div className="absolute inset-x-2 top-1/2 h-0.5 bg-orange-400 shadow-[0_0_8px_#f97316] animate-bounce" />
                    </div>
                  </div>

                  {/* Camera switcher */}
                  <button
                    onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
                    className="absolute bottom-3 right-3 p-2 bg-slate-900/80 hover:bg-black text-white rounded-lg backdrop-blur-xs transition-colors"
                    title="Flip camera"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              )}

              <p className="text-center text-xs text-slate-500">
                Align the printed document QR code within the frame to verify automatically.
              </p>

              {/* Quick Sample Trigger */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Testing in preview?</span>
                <button
                  onClick={() => {
                    stopCamera();
                    onScan('SV-A7K2M-9P3XQ-4W8NR');
                    onClose();
                  }}
                  className="font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  <Sparkles size={13} />
                  Simulate QR Scan
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div 
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                  dragOver ? 'border-orange-500 bg-orange-50/50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-3">
                  <ImageIcon size={24} />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  Upload Scanned Document or QR Image
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
                  Drag and drop a PNG, JPG, or screenshot containing the verification code.
                </p>

                <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs">
                  <Upload size={14} />
                  <span>{isProcessing ? 'Analyzing Image...' : 'Browse Image File'}</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }} 
                  />
                </label>
              </div>

              <div className="text-center">
                <button
                  onClick={() => {
                    onScan('SV-A7K2M-9P3XQ-4W8NR');
                    onClose();
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
                >
                  Or simulate test sample code: SV-A7K2M-9P3XQ-4W8NR
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
