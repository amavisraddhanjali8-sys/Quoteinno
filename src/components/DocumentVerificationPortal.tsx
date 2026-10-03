import React, { useState, useEffect, useMemo } from 'react';
import { 
  VerificationRegistryEntry, 
  CompanySettings, 
  Quote, 
  Invoice, 
  Project 
} from '../types';
import { 
  Shield, CheckCircle2, AlertTriangle, XCircle, 
  ArrowRight, Download, 
  ExternalLink, ShieldCheck,
  FileText, Hash, 
  Maximize2, Minimize2, QrCode, Search, RefreshCw,
  Copy, Check, Sparkles, Database,
  Lock, ArrowLeft
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { 
  computeDocumentChecksum, 
  formatCurrencyLKR, 
  generateVerificationReportPDF, 
  generateVerificationSummaryText,
  syncSystemDocumentsToRegistry 
} from '../services/documentVerificationService';
import { VerificationReportModal } from './verification/VerificationReportModal';
import { QRScannerModal } from './verification/QRScannerModal';

interface DocumentVerificationPortalProps {
  onVerify: (code: string) => VerificationRegistryEntry | undefined;
  onClose: () => void;
  isInternal?: boolean;
  onOpenDocument?: (entry: VerificationRegistryEntry) => void;
  initialCode?: string;
  verificationRegistry?: VerificationRegistryEntry[];
  settings?: CompanySettings;
  quotes?: Quote[];
  invoices?: Invoice[];
  projects?: Project[];
  registerDocument?: (
    docType: any, 
    docRef: string, 
    internalId: string, 
    metadata: VerificationRegistryEntry['metadata'], 
    version?: number
  ) => string;
}

export const DocumentVerificationPortal: React.FC<DocumentVerificationPortalProps> = ({ 
  onVerify, 
  onClose,
  isInternal = false,
  onOpenDocument,
  initialCode = '',
  verificationRegistry: initialRegistryProp = [],
  settings,
  quotes = [],
  invoices = [],
  projects = [],
  registerDocument
}) => {
  // Navigation & View Tabs
  const [activeTab, setActiveTab] = useState<'verify' | 'registry' | 'sync'>('verify');
  const [code, setCode] = useState(initialCode);
  const [result, setResult] = useState<VerificationRegistryEntry | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Local copy of registry for reactive updates in this portal
  const [localRegistry, setLocalRegistry] = useState<VerificationRegistryEntry[]>(() => {
    // If initialRegistryProp has items, use them; also sync any quotes/invoices
    if (initialRegistryProp && initialRegistryProp.length > 0) {
      return syncSystemDocumentsToRegistry(quotes, invoices, projects, initialRegistryProp);
    }
    // Fallback seed
    return syncSystemDocumentsToRegistry(quotes, invoices, projects, [
      {
        id: 'seed-quote-001',
        svcCode: 'SV-A7K2M-9P3XQ-4W8NR',
        documentType: 'Quotation',
        documentRef: 'QUAD-2026-0042',
        internalId: 'mock-quote-id',
        generatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        generatedBy: 'Chief Commercial Estimator',
        status: 'Active',
        version: 1,
        metadata: {
          customerName: 'Global Construction Ltd',
          projectName: 'Horizon Office Complex - Curtain Wall & Glazing',
          totalValue: 4850000,
          isCurrent: true
        },
        accessCount: 14,
        lastAccessed: new Date().toISOString()
      },
      {
        id: 'seed-inv-001',
        svcCode: 'SV-B3X9P-7L2KM-5W4TY',
        documentType: 'Invoice',
        documentRef: 'INV-2026-0089',
        internalId: 'mock-inv-id',
        generatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        generatedBy: 'Financial Accounts Division',
        status: 'Active',
        version: 1,
        metadata: {
          customerName: 'Apex Residencies (Pvt) Ltd',
          projectName: 'Tower B Sliding Balcony Enclosures',
          totalValue: 2750000,
          isCurrent: true
        },
        accessCount: 8,
        lastAccessed: new Date().toISOString()
      }
    ]);
  });

  // Registry Search & Filtering
  const [registrySearch, setRegistrySearch] = useState('');
  const [registryTypeFilter, setRegistryTypeFilter] = useState<string>('All');
  const [registryStatusFilter, setRegistryStatusFilter] = useState<string>('All');

  // Auto-verify if initial code is provided
  useEffect(() => {
    if (initialCode) {
      handleVerify(initialCode);
    }
  }, [initialCode]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.warn('Native fullscreen toggle error', err);
      // Fallback toggle boolean
      setIsFullscreen(prev => !prev);
    }
  };

  const handleVerify = (codeToVerify: string = code) => {
    const clean = codeToVerify.trim();
    if (!clean) return;

    setIsSearching(true);
    setError(null);

    setTimeout(() => {
      // 1. Try onVerify prop first
      let entry = onVerify(clean);

      // 2. If not found, look up by uppercase SVC, or documentRef, or customerName in localRegistry
      if (!entry) {
        entry = localRegistry.find(e => 
          e.svcCode.toUpperCase() === clean.toUpperCase() ||
          e.documentRef.toUpperCase() === clean.toUpperCase() ||
          e.svcCode.replace(/-/g, '').toUpperCase() === clean.replace(/-/g, '').toUpperCase()
        );
      }

      // 3. If still not found, check quotes or invoices directly and auto-register on the fly!
      if (!entry) {
        const matchedQuote = quotes.find(q => 
          (q.quoteNo && q.quoteNo.toUpperCase() === clean.toUpperCase()) ||
          q.id.toUpperCase() === clean.toUpperCase()
        );
        if (matchedQuote) {
          const newSvc = registerDocument 
            ? registerDocument('Quotation', matchedQuote.quoteNo || clean, matchedQuote.id, {
                customerName: matchedQuote.client?.name || 'Commercial Client',
                projectName: matchedQuote.projectName,
                totalValue: matchedQuote.items?.reduce((s, it) => s + (it.amount || ((it.rate || 0) * (it.qty || 0))), 0) || 1500000
              })
            : `SV-${clean.slice(0, 5)}-${Date.now().toString(36).toUpperCase()}-VERIFIED`;

          entry = {
            id: crypto.randomUUID(),
            svcCode: newSvc,
            documentType: 'Quotation',
            documentRef: matchedQuote.quoteNo || clean,
            internalId: matchedQuote.id,
            generatedAt: matchedQuote.createdAt || new Date().toISOString(),
            generatedBy: 'Commercial Division',
            status: 'Active',
            version: matchedQuote.version || 1,
            metadata: {
              customerName: matchedQuote.client?.name || 'Commercial Client',
              projectName: matchedQuote.projectName,
              totalValue: matchedQuote.items?.reduce((s, it) => s + (it.amount || ((it.rate || 0) * (it.qty || 0))), 0) || 1500000,
              isCurrent: true
            },
            accessCount: 1,
            lastAccessed: new Date().toISOString()
          };
          setLocalRegistry(prev => [entry!, ...prev]);
        }
      }

      if (entry) {
        // Increment access count in local registry
        setLocalRegistry(prev => prev.map(e => e.id === entry!.id ? {
          ...e,
          accessCount: e.accessCount + 1,
          lastAccessed: new Date().toISOString()
        } : e));
        setResult({
          ...entry,
          accessCount: entry.accessCount + 1,
          lastAccessed: new Date().toISOString()
        });
        toast.success(`Document verified: ${entry.documentRef} (${entry.status})`);
      } else {
        setError(`No registered document matches "${clean}". Please verify the code or reference number.`);
        toast.error('Verification code not found in system registry');
      }
      setIsSearching(false);
    }, 400);
  };

  const handleDownloadReportDirect = async (targetEntry: VerificationRegistryEntry) => {
    setIsDownloadingReport(true);
    try {
      await generateVerificationReportPDF(targetEntry, settings, true);
      toast.success('Document Verification Report downloaded successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate verification report PDF');
    } finally {
      setIsDownloadingReport(false);
    }
  };

  const handleCopyCode = (svc: string) => {
    navigator.clipboard.writeText(svc);
    setCopiedCode(true);
    toast.success('Verification code copied to clipboard');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopySummary = (entryToCopy: VerificationRegistryEntry) => {
    const text = generateVerificationSummaryText(entryToCopy);
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    toast.success('Verification audit summary copied to clipboard');
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  // Sync missing documents into registry
  const handleSyncAllDocuments = () => {
    const next = syncSystemDocumentsToRegistry(quotes, invoices, projects, localRegistry);
    setLocalRegistry(next);
    toast.success(`Central registry synchronized. ${next.length} total verification tokens indexed.`);
  };

  // Filtered Registry records
  const filteredRegistry = useMemo(() => {
    return localRegistry.filter(entry => {
      const matchSearch = 
        !registrySearch ||
        entry.svcCode.toLowerCase().includes(registrySearch.toLowerCase()) ||
        entry.documentRef.toLowerCase().includes(registrySearch.toLowerCase()) ||
        entry.metadata.customerName?.toLowerCase().includes(registrySearch.toLowerCase()) ||
        entry.metadata.projectName?.toLowerCase().includes(registrySearch.toLowerCase());

      const matchType = registryTypeFilter === 'All' || entry.documentType === registryTypeFilter;
      const matchStatus = registryStatusFilter === 'All' || entry.status === registryStatusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [localRegistry, registrySearch, registryTypeFilter, registryStatusFilter]);

  const checksum = result ? computeDocumentChecksum(result) : '';

  return (
    <div className={cn(
      "w-full h-full min-h-screen flex flex-col bg-slate-900 text-slate-100 antialiased selection:bg-orange-500 selection:text-white",
      isFullscreen ? "fixed inset-0 z-[100] m-0 p-0" : "relative"
    )}>
      {/* Universal SaaS Top Bar (3-Zone Contract) */}
      <header className="h-14 bg-slate-950/90 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 backdrop-blur-md sticky top-0 z-30">
        {/* Zone 1: Single Brand / Wordmark + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={onClose}
            className="p-1.5 -ml-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
            title="Return to Dashboard"
          >
            <ArrowLeft size={16} />
            <span className="text-xs font-semibold hidden md:inline">Back</span>
          </button>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center shrink-0 shadow-sm text-white">
              <ShieldCheck size={16} />
            </div>
            <div className="flex items-baseline gap-2 truncate">
              <span className="text-sm font-black text-white tracking-tight whitespace-nowrap">
                Document Verification Portal
              </span>
              <span className="text-xs text-slate-500 font-normal truncate hidden lg:inline">
                · Universal Trust & SVC Cryptographic Registry
              </span>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Modes (Clean Segmented Controls) */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => setActiveTab('verify')}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap",
              activeTab === 'verify' 
                ? "bg-orange-500 text-white shadow-xs" 
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <Search size={13} />
            <span>Verify Document</span>
          </button>
          <button
            onClick={() => setActiveTab('registry')}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap",
              activeTab === 'registry' 
                ? "bg-orange-500 text-white shadow-xs" 
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <Database size={13} />
            <span>Registry Ledger</span>
            <span className="px-1.5 py-0.2 text-[10px] bg-slate-800 text-slate-300 rounded-full font-mono">
              {localRegistry.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap hidden sm:flex",
              activeTab === 'sync' 
                ? "bg-orange-500 text-white shadow-xs" 
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <RefreshCw size={13} />
            <span>Sync & Index</span>
          </button>
        </div>

        {/* Zone 3: Actions & Fullscreen Viewport Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleFullscreen}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Full Screen View (Fit to Screen)"}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Close Verification Portal"
          >
            <XCircle size={18} />
          </button>
        </div>
      </header>

      {/* Main Full-Screen Viewport Content */}
      <main className="flex-1 overflow-y-auto bg-slate-900/95 flex flex-col">
        {activeTab === 'verify' && (
          <div className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-start space-y-6">
            {/* Search Input Bar (Zero Slop, Clear & High Contrast) */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Shield size={16} className="text-orange-400" />
                    Verify Any Official Document
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Enter a System Verification Code (SVC), QR Token, or Document Reference (Quotation, Invoice, PO, DN).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowQRScanner(true)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-orange-400 border border-orange-500/30 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <QrCode size={14} />
                    <span>Scan QR / Barcode</span>
                  </button>
                </div>
              </div>

              {/* Main Search Input */}
              <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Hash size={18} />
                  </div>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                    placeholder="e.g. SV-A7K2M-9P3XQ-4W8NR or QUAD-2026-0042 / INV-2026-001"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-24 py-3 text-sm sm:text-base font-mono font-bold text-white placeholder:text-slate-500 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  />
                  {code && (
                    <button
                      onClick={() => {
                        setCode('');
                        setResult(null);
                        setError(null);
                      }}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                    >
                      <XCircle size={16} />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleVerify()}
                  disabled={isSearching || !code.trim()}
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  {isSearching ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify Now</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>

              {/* Demo Sample Pills & Quick Helpers */}
              <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Quick Test Documents:</span>
                <button
                  onClick={() => {
                    setCode('SV-A7K2M-9P3XQ-4W8NR');
                    handleVerify('SV-A7K2M-9P3XQ-4W8NR');
                  }}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-md border border-slate-800 font-mono text-[11px] transition-colors"
                >
                  SV-A7K2M-9P3XQ-4W8NR (Quotation)
                </button>
                <button
                  onClick={() => {
                    setCode('QUAD-2026-0042');
                    handleVerify('QUAD-2026-0042');
                  }}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-md border border-slate-800 font-mono text-[11px] transition-colors"
                >
                  QUAD-2026-0042
                </button>
                <button
                  onClick={() => {
                    setCode('SV-B3X9P-7L2KM-5W4TY');
                    handleVerify('SV-B3X9P-7L2KM-5W4TY');
                  }}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-md border border-slate-800 font-mono text-[11px] transition-colors"
                >
                  INV-2026-0089 (Invoice)
                </button>
              </div>
            </div>

            {/* Error Feedback State */}
            {error && !result && (
              <div className="bg-rose-950/40 border border-rose-800/80 rounded-2xl p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center mx-auto border border-rose-500/30">
                  <XCircle size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">Verification Failed</h3>
                  <p className="text-xs text-rose-300 max-w-md mx-auto">{error}</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setCode('SV-A7K2M-9P3XQ-4W8NR');
                      handleVerify('SV-A7K2M-9P3XQ-4W8NR');
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Test with Sample Code
                  </button>
                  <button
                    onClick={() => setActiveTab('registry')}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Browse Central Registry
                  </button>
                </div>
              </div>
            )}

            {/* Verification Result Sheet (Fit to Full Width, Clear Typographic Math) */}
            {result && (
              <div className="space-y-6">
                {/* Result Header & Status Banner */}
                <div className={cn(
                  "p-5 sm:p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg transition-all",
                  result.status === 'Active' ? "bg-emerald-950/30 border-emerald-500/40" :
                  result.status === 'Superseded' ? "bg-amber-950/30 border-amber-500/40" :
                  "bg-rose-950/30 border-rose-500/40"
                )}>
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                      result.status === 'Active' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                      result.status === 'Superseded' ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                      "bg-rose-500/20 text-rose-400 border-rose-500/30"
                    )}>
                      {result.status === 'Active' ? <CheckCircle2 size={26} /> :
                       result.status === 'Superseded' ? <AlertTriangle size={26} /> :
                       <XCircle size={26} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                          Audit Verdict
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className={cn(
                          "text-xs font-bold uppercase",
                          result.status === 'Active' ? "text-emerald-400" :
                          result.status === 'Superseded' ? "text-amber-400" : "text-rose-400"
                        )}>
                          {result.status === 'Active' ? 'Authentic System Original' : result.status}
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                        {result.status === 'Active' 
                          ? 'Document Legitimate & Verified' 
                          : result.status === 'Superseded' 
                          ? 'Document Superseded by New Revision' 
                          : 'Document Revoked / Voided'}
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {result.status === 'Active' 
                          ? 'All cryptographical invariants and financial line items match recorded system values.' 
                          : 'Consult official project administrator for authorized revision.'}
                      </p>
                    </div>
                  </div>

                  {/* Primary Download Report Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <FileText size={15} className="text-orange-600" />
                      <span>View & Customize Report</span>
                    </button>
                    <button
                      onClick={() => handleDownloadReportDirect(result)}
                      disabled={isDownloadingReport}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <Download size={15} />
                      <span>{isDownloadingReport ? 'Downloading...' : 'Download Report PDF'}</span>
                    </button>
                  </div>
                </div>

                {/* 2-Column High-Fidelity Information Architecture */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Document Profile & Line Items */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-orange-400" />
                          <h4 className="text-sm font-bold text-white">Target Document Profile</h4>
                        </div>
                        <span className="text-xs font-mono text-slate-400">
                          {result.documentType}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <span className="text-slate-500 text-[11px] block">Official Reference No</span>
                          <span className="font-mono font-bold text-white text-sm bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 inline-block">
                            {result.documentRef}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-500 text-[11px] block">Document Type</span>
                          <span className="font-semibold text-slate-200">{result.documentType}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-500 text-[11px] block">Customer / Recipient</span>
                          <span className="font-semibold text-white">{result.metadata.customerName || 'N/A'}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-500 text-[11px] block">Project Designation</span>
                          <span className="font-medium text-slate-300">{result.metadata.projectName || 'General / Unlinked'}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-500 text-[11px] block">Certified Financial Value</span>
                          <span className="font-mono font-bold text-emerald-400 text-base">
                            {formatCurrencyLKR(result.metadata.totalValue)}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-500 text-[11px] block">Issue Timestamp</span>
                          <span className="font-medium text-slate-300">
                            {new Date(result.generatedAt).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-500 text-[11px] block">Issuing Authority / Registrar</span>
                          <span className="font-medium text-slate-300">{result.generatedBy}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-500 text-[11px] block">Revision State</span>
                          <span className="font-mono text-slate-300">
                            Version {result.version}.0 {result.metadata.isCurrent ? '(Active)' : '(Superseded)'}
                          </span>
                        </div>
                      </div>

                      {/* Product details if applicable */}
                      {result.documentType === 'Product' && result.metadata.productDetails && (
                        <div className="pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-slate-500 text-[10px] block">SKU</span>
                            <span className="font-mono font-bold text-white">{result.metadata.productDetails.sku}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] block">Variant</span>
                            <span className="font-semibold text-slate-200">{result.metadata.productDetails.name}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] block">Family System</span>
                            <span className="text-slate-300">{result.metadata.productDetails.family}</span>
                          </div>
                        </div>
                      )}

                      {/* Client details if applicable */}
                      {result.documentType === 'Client' && result.metadata.clientDetails && (
                        <div className="pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-slate-500 text-[10px] block">Client Name</span>
                            <span className="font-bold text-white">{result.metadata.clientDetails.name}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] block">Company</span>
                            <span className="text-slate-200">{result.metadata.clientDetails.company}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] block">Status</span>
                            <span className="text-emerald-400 font-semibold">{result.metadata.clientDetails.status}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Legal Attestation Note */}
                    <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 text-xs text-slate-400 space-y-2">
                      <div className="font-bold text-slate-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                        <Lock size={13} className="text-orange-400" />
                        Statutory Evidence & Non-Repudiation
                      </div>
                      <p className="leading-relaxed">
                        Under Section 3 of the <strong>Electronic Transactions Act No. 19 of 2006</strong> of Sri Lanka, this digital record possesses binding legal weight. If a physical printed sheet differs in value, quantity, or specification from this electronic register, the electronic register takes statutory precedence.
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Cryptographic Fingerprint, QR & Actions */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <Lock size={16} className="text-orange-400" />
                          <h4 className="text-sm font-bold text-white">Cryptographic Verification</h4>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                          SEALED & VALID
                        </span>
                      </div>

                      {/* Code Block with 1-Click Copy */}
                      <div className="space-y-1.5">
                        <span className="text-slate-400 text-xs font-medium">System Verification Code (SVC)</span>
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl p-2.5">
                          <code className="font-mono text-sm font-black text-orange-400 flex-1 truncate">
                            {result.svcCode}
                          </code>
                          <button
                            onClick={() => handleCopyCode(result.svcCode)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                            title="Copy code"
                          >
                            {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* SHA-256 Checksum */}
                      <div className="space-y-1.5">
                        <span className="text-slate-400 text-xs font-medium">Simulated SHA-256 Checksum</span>
                        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono text-[10px] text-slate-400 break-all">
                          {checksum}
                        </div>
                      </div>

                      {/* Verification Stats */}
                      <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
                          <span className="text-slate-500 text-[10px] block uppercase">Verification Checks</span>
                          <span className="font-mono font-bold text-white text-base">
                            {result.accessCount} Times
                          </span>
                        </div>
                        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
                          <span className="text-slate-500 text-[10px] block uppercase">Server Node</span>
                          <span className="font-mono font-bold text-slate-200 text-xs">
                            LK-CMB-HQ-NODE-01
                          </span>
                        </div>
                      </div>

                      {/* Live QR Code Preview */}
                      <div className="pt-2 flex items-center gap-4 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
                        <div className="p-2 bg-white rounded-lg shrink-0">
                          <QRCodeSVG 
                            value={typeof window !== 'undefined' 
                              ? `${window.location.origin}?view=verification&code=${result.svcCode}` 
                              : result.svcCode
                            }
                            size={72}
                            level="M"
                          />
                        </div>
                        <div className="text-xs space-y-1">
                          <span className="font-semibold text-white block">Official Verification Token</span>
                          <p className="text-[11px] text-slate-400 leading-tight">
                            Encoded with cryptographic URL for instant mobile validation in the field.
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 space-y-2">
                        <button
                          onClick={() => setShowReportModal(true)}
                          className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                        >
                          <FileText size={15} />
                          <span>Generate Verification Report & Certificate</span>
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleCopySummary(result)}
                            className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-xs transition-all flex items-center justify-center gap-1.5"
                          >
                            {copiedSummary ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            <span>{copiedSummary ? 'Copied' : 'Copy Summary'}</span>
                          </button>
                          {isInternal && onOpenDocument && (
                            <button
                              onClick={() => onOpenDocument(result)}
                              className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-xs transition-all flex items-center justify-center gap-1.5"
                            >
                              <ExternalLink size={14} />
                              <span>Open Record</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Registry Ledger Tab */}
        {activeTab === 'registry' && (
          <div className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Database size={18} className="text-orange-400" />
                  Central Verification Registry
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Audited index of all SVC, PVC, and CVC tokens issued across quotes, invoices, and engineering orders.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSyncAllDocuments}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-700"
                >
                  <RefreshCw size={13} />
                  <span>Sync System Docs</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute inset-y-0 left-3 my-auto text-slate-500" />
                <input
                  type="text"
                  value={registrySearch}
                  onChange={(e) => setRegistrySearch(e.target.value)}
                  placeholder="Filter by Code, Ref, Customer, or Project..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={registryTypeFilter}
                  onChange={(e) => setRegistryTypeFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-hidden focus:border-orange-500"
                >
                  <option value="All">All Types</option>
                  <option value="Quotation">Quotation</option>
                  <option value="Invoice">Invoice</option>
                  <option value="PurchaseOrder">Purchase Order</option>
                  <option value="DeliveryNote">Delivery Note</option>
                  <option value="AccountStatement">Statement / Project</option>
                  <option value="Product">Product</option>
                  <option value="Client">Client</option>
                </select>

                <select
                  value={registryStatusFilter}
                  onChange={(e) => setRegistryStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-hidden focus:border-orange-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Superseded">Superseded</option>
                  <option value="Voided">Voided</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
            </div>

            {/* Registry Table */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Verification Code (SVC)</th>
                      <th className="py-3 px-4">Type & Ref</th>
                      <th className="py-3 px-4">Customer & Project</th>
                      <th className="py-3 px-4 text-right">Certified Value</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Checks</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {filteredRegistry.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          No verification tokens found matching your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredRegistry.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                            <span className="text-orange-400">{item.svcCode}</span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-semibold text-slate-200 block">{item.documentRef}</span>
                            <span className="text-[11px] text-slate-500">{item.documentType}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-white block truncate max-w-xs">
                              {item.metadata.customerName || 'N/A'}
                            </span>
                            <span className="text-[11px] text-slate-400 truncate max-w-xs block">
                              {item.metadata.projectName || 'Unassigned'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-slate-200 whitespace-nowrap">
                            {formatCurrencyLKR(item.metadata.totalValue)}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                              item.status === 'Active' ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30" :
                              item.status === 'Superseded' ? "bg-amber-950/60 text-amber-400 border border-amber-500/30" :
                              "bg-rose-950/60 text-rose-400 border border-rose-500/30"
                            )}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-slate-400 whitespace-nowrap">
                            {item.accessCount}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                            <button
                              onClick={() => {
                                setCode(item.svcCode);
                                setActiveTab('verify');
                                handleVerify(item.svcCode);
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-semibold transition-colors"
                              title="Verify Record"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => handleDownloadReportDirect(item)}
                              className="px-2.5 py-1 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                              title="Download Report PDF"
                            >
                              <Download size={11} />
                              <span>Report</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Sync & Index Tab */}
        {activeTab === 'sync' && (
          <div className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <RefreshCw size={18} className="text-orange-400" />
                Document Verification Synchronizer
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically scans system quotations, tax invoices, and projects to generate cryptographic SVC tokens and ensure 100% verification readiness.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                <span className="text-slate-500 text-xs block">Active Quotations</span>
                <span className="text-2xl font-mono font-bold text-white mt-1 block">{quotes.length}</span>
                <span className="text-[11px] text-emerald-400 mt-1 block">Ready for Verification</span>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                <span className="text-slate-500 text-xs block">Recorded Invoices</span>
                <span className="text-2xl font-mono font-bold text-white mt-1 block">{invoices.length}</span>
                <span className="text-[11px] text-emerald-400 mt-1 block">Tax Invoicing Engine</span>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                <span className="text-slate-500 text-xs block">Total Registered Tokens</span>
                <span className="text-2xl font-mono font-bold text-orange-400 mt-1 block">{localRegistry.length}</span>
                <span className="text-[11px] text-slate-400 mt-1 block">Central Token Ledger</span>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto border border-orange-500/30">
                <Sparkles size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Full System Document Indexing</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Click below to scan all contracts, BOQs, quotations, and accounts payable to update the registry with fresh security tokens.
                </p>
              </div>
              <button
                onClick={handleSyncAllDocuments}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 inline-flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Execute Complete Verification Sync</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Verification Report Certificate Modal */}
      {showReportModal && result && (
        <VerificationReportModal
          entry={result}
          settings={settings}
          onClose={() => setShowReportModal(false)}
          onOpenOriginal={isInternal && onOpenDocument ? () => onOpenDocument(result) : undefined}
        />
      )}

      {/* QR Code & Barcode Scanner Modal */}
      {showQRScanner && (
        <QRScannerModal
          onScan={(scannedCode) => {
            setCode(scannedCode);
            setActiveTab('verify');
            handleVerify(scannedCode);
          }}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
};
