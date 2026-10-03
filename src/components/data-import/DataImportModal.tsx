import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  X, UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, 
  AlertCircle, Trash2, Plus, Download, RefreshCw, 
  ArrowRight, ArrowLeft, Search, ShieldCheck, Check, 
  Info, Copy, Sparkles, Maximize2, Minimize2
} from 'lucide-react';
import { 
  ImportEntityType, StagingRow, ColumnMapping, 
  ENTITY_SCHEMAS, downloadSampleTemplate, parseImportFile, 
  parsePastedSpreadsheetText, autoMapColumns, evaluateRowVeracity, 
  calculateValidationSummary, ConflictResolutionMode, 
  convertStagingToItemTemplates, convertStagingToClients, 
  convertStagingToProjects, convertStagingToInvoices, 
  convertStagingToPersonnel, convertStagingToEquipment, 
  convertStagingToBOQLines 
} from '../../services/dataImportService';
import { 
  ItemTemplate, Client, Project, Invoice, Personnel, 
  Equipment, BOQItem, ItemCategory 
} from '../../types';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEntity?: ImportEntityType;
  
  // Existing data arrays for cross-checking & conflict resolution
  existingData: {
    itemTemplates?: ItemTemplate[];
    clients?: Client[];
    projects?: Project[];
    invoices?: Invoice[];
    personnel?: Personnel[];
    equipment?: Equipment[];
    categories?: ItemCategory[];
  };

  // Commit callbacks
  onCommitItemTemplates?: (items: ItemTemplate[], summary: string) => void;
  onCommitClients?: (clients: Client[], summary: string) => void;
  onCommitProjects?: (projects: Project[], summary: string) => void;
  onCommitInvoices?: (invoices: Invoice[], summary: string) => void;
  onCommitPersonnel?: (personnel: Personnel[], summary: string) => void;
  onCommitEquipment?: (equipment: Equipment[], summary: string) => void;
  onCommitBOQLines?: (lines: BOQItem[], summary: string) => void;
}

type WizardStep = 'SOURCE' | 'MAPPING' | 'EDITOR' | 'CONFIRM';

export const DataImportModal: React.FC<DataImportModalProps> = ({
  isOpen,
  onClose,
  defaultEntity = 'boq_items',
  existingData,
  onCommitItemTemplates,
  onCommitClients,
  onCommitProjects,
  onCommitInvoices,
  onCommitPersonnel,
  onCommitEquipment,
  onCommitBOQLines
}) => {
  const [selectedEntity, setSelectedEntity] = useState<ImportEntityType>(defaultEntity);
  const [currentStep, setCurrentStep] = useState<WizardStep>('SOURCE');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [isParsing, setIsParsing] = useState<boolean>(false);

  // Raw file state
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [rawRows, setRawRows] = useState<any[][]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);

  // Staging state
  const [stagingRows, setStagingRows] = useState<StagingRow[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'errors' | 'warnings' | 'valid'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [conflictMode, setConflictMode] = useState<ConflictResolutionMode>('UPSERT');
  const [veracityConfirmed, setVeracityConfirmed] = useState<boolean>(false);

  // Paste mode tab in Source step
  const [sourceTab, setSourceTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Build existing primary key lookup for current entity
  const existingKeysSet = useMemo(() => {
    const keys = new Set<string>();
    if (selectedEntity === 'boq_items' && existingData.itemTemplates) {
      existingData.itemTemplates.forEach(t => {
        if (t.productCode) keys.add(t.productCode.toLowerCase().trim());
        if (t.id) keys.add(t.id.toLowerCase().trim());
      });
    } else if (selectedEntity === 'clients' && existingData.clients) {
      existingData.clients.forEach(c => {
        if (c.name) keys.add(c.name.toLowerCase().trim());
        if (c.cvcCode) keys.add(c.cvcCode.toLowerCase().trim());
      });
    } else if (selectedEntity === 'projects' && existingData.projects) {
      existingData.projects.forEach(p => {
        if (p.projectName) keys.add(p.projectName.toLowerCase().trim());
      });
    } else if (selectedEntity === 'invoices' && existingData.invoices) {
      existingData.invoices.forEach(i => {
        if (i.invoiceNo) keys.add(i.invoiceNo.toLowerCase().trim());
      });
    } else if (selectedEntity === 'personnel' && existingData.personnel) {
      existingData.personnel.forEach(p => {
        if (p.name) keys.add(p.name.toLowerCase().trim());
      });
    } else if (selectedEntity === 'equipment' && existingData.equipment) {
      existingData.equipment.forEach(e => {
        if (e.name) keys.add(e.name.toLowerCase().trim());
      });
    }
    return keys;
  }, [selectedEntity, existingData]);

  // Overall Validation Summary
  const validationSummary = useMemo(() => {
    return calculateValidationSummary(stagingRows);
  }, [stagingRows]);

  // Reset wizard when entity changes or closed
  const resetWizard = (newEntity?: ImportEntityType) => {
    if (newEntity) setSelectedEntity(newEntity);
    setCurrentStep('SOURCE');
    setUploadedFileName('');
    setRawRows([]);
    setColumnMappings([]);
    setStagingRows([]);
    setVeracityConfirmed(false);
    setPastedText('');
  };

  if (!isOpen) return null;

  const currentSchema = ENTITY_SCHEMAS[selectedEntity];

  // ==========================================
  // HANDLERS: FILE INGESTION & PARSING
  // ==========================================

  const handleProcessFile = async (file: File) => {
    setIsParsing(true);
    try {
      const parsed = await parseImportFile(file);
      setUploadedFileName(file.name);
      setRawRows(parsed.rawRows);

      // Auto map columns
      const autoMappings = autoMapColumns(parsed.headers, selectedEntity);
      setColumnMappings(autoMappings);

      toast.success(`Parsed ${parsed.rawRows.length} rows from "${file.name}"`);
      setCurrentStep('MAPPING');
    } catch (err: any) {
      toast.error(err.message || 'Failed to read file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleProcessPastedText = () => {
    if (!pastedText.trim()) {
      toast.error('Please paste spreadsheet tabular data first.');
      return;
    }
    try {
      const parsed = parsePastedSpreadsheetText(pastedText);
      setUploadedFileName(`Pasted_Data_${new Date().toLocaleTimeString()}`);
      setRawRows(parsed.rawRows);

      const autoMappings = autoMapColumns(parsed.headers, selectedEntity);
      setColumnMappings(autoMappings);

      toast.success(`Detected ${parsed.rawRows.length} rows from clipboard text`);
      setCurrentStep('MAPPING');
    } catch (err: any) {
      toast.error(err.message || 'Failed to parse clipboard data.');
    }
  };

  // ==========================================
  // HANDLERS: MAPPING TO STAGING CONVERSION
  // ==========================================

  const handleBuildStagingRows = () => {
    // Check required schema fields have a mapping
    const mappedFieldKeys = new Set(columnMappings.map(m => m.targetFieldKey).filter(Boolean));
    const missingRequired = currentSchema.fields.filter(f => f.required && !mappedFieldKeys.has(f.key));

    if (missingRequired.length > 0) {
      toast.error(`Please map required field: ${missingRequired.map(f => f.label).join(', ')}`);
      return;
    }

    const seenKeysInBatch = new Map<string, number>();

    const rows: StagingRow[] = rawRows.map((rawRow, idx) => {
      const rowData: Record<string, any> = {};

      // Initialize defaults
      currentSchema.fields.forEach(field => {
        if (field.defaultValue !== undefined) {
          rowData[field.key] = field.defaultValue;
        }
      });

      // Map values from rawRow
      columnMappings.forEach((map, colIdx) => {
        if (map.targetFieldKey && colIdx < rawRow.length) {
          let cellVal = rawRow[colIdx];
          if (cellVal !== undefined && cellVal !== null) {
            // Trim if string
            if (typeof cellVal === 'string') cellVal = cellVal.trim();
            rowData[map.targetFieldKey] = cellVal;
          }
        }
      });

      // Evaluate veracity
      const evalResult = evaluateRowVeracity(
        rowData,
        selectedEntity,
        existingKeysSet,
        seenKeysInBatch,
        idx
      );

      return {
        _rowId: crypto.randomUUID(),
        _status: evalResult.status,
        _errors: evalResult.errors,
        _warnings: evalResult.warnings,
        _isDuplicateInFile: evalResult.isDuplicateInFile,
        _isExistingInSystem: evalResult.isExistingInSystem,
        data: rowData
      };
    });

    setStagingRows(rows);
    setCurrentStep('EDITOR');
  };

  // Re-run validation on staging rows after user edit
  const revalidateAllRows = (rowsToValidate: StagingRow[]): StagingRow[] => {
    const seenKeysInBatch = new Map<string, number>();
    return rowsToValidate.map((r, idx) => {
      const evalResult = evaluateRowVeracity(
        r.data,
        selectedEntity,
        existingKeysSet,
        seenKeysInBatch,
        idx
      );
      return {
        ...r,
        _status: evalResult.status,
        _errors: evalResult.errors,
        _warnings: evalResult.warnings,
        _isDuplicateInFile: evalResult.isDuplicateInFile,
        _isExistingInSystem: evalResult.isExistingInSystem
      };
    });
  };

  // ==========================================
  // HANDLERS: STAGING ROW EDITING
  // ==========================================

  const handleCellChange = (rowId: string, fieldKey: string, newValue: any) => {
    setStagingRows(prev => {
      const updated = prev.map(row => {
        if (row._rowId !== rowId) return row;
        return {
          ...row,
          data: {
            ...row.data,
            [fieldKey]: newValue
          }
        };
      });
      return revalidateAllRows(updated);
    });
  };

  const handleDeleteStagingRow = (rowId: string) => {
    setStagingRows(prev => {
      const remaining = prev.filter(r => r._rowId !== rowId);
      return revalidateAllRows(remaining);
    });
    toast.info('Row removed from staging batch');
  };

  const handleDuplicateRow = (row: StagingRow) => {
    const pk = currentSchema.primaryKey;
    const duplicatedData = { ...row.data };
    if (duplicatedData[pk]) {
      duplicatedData[pk] = `${duplicatedData[pk]}-COPY`;
    }
    const newRow: StagingRow = {
      _rowId: crypto.randomUUID(),
      _status: 'valid',
      _errors: {},
      _warnings: {},
      data: duplicatedData
    };
    setStagingRows(prev => revalidateAllRows([...prev, newRow]));
    toast.success('Row duplicated');
  };

  const handleAddNewManualRow = () => {
    const pk = currentSchema.primaryKey;
    const initialData: Record<string, any> = {};
    currentSchema.fields.forEach(f => {
      initialData[f.key] = f.defaultValue !== undefined ? f.defaultValue : '';
    });
    initialData[pk] = `NEW-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRow: StagingRow = {
      _rowId: crypto.randomUUID(),
      _status: 'warning',
      _errors: {},
      _warnings: { [pk]: 'Newly created row. Verify field values.' },
      data: initialData
    };
    setStagingRows(prev => revalidateAllRows([newRow, ...prev]));
    toast.success('Added new empty row at top of editor');
  };

  // ==========================================
  // BULK REPAIR & QUICK-FIX ACTIONS
  // ==========================================

  const handleAutoFixIssues = () => {
    const pk = currentSchema.primaryKey;
    let fixedCount = 0;

    const fixed = stagingRows.map((row) => {
      const data = { ...row.data };

      // 1. If missing primary key, generate one
      if (!data[pk] || String(data[pk]).trim() === '') {
        data[pk] = `GEN-${Math.floor(10000 + Math.random() * 90000)}`;
        fixedCount++;
      }

      // 2. Fix negative rates or empty units
      currentSchema.fields.forEach(f => {
        if (f.type === 'number' && (data[f.key] < 0 || isNaN(data[f.key]))) {
          data[f.key] = Math.abs(Number(data[f.key]) || 0);
          fixedCount++;
        }
        if (f.key === 'unit' && (!data.unit || String(data.unit).trim() === '')) {
          data.unit = 'm²';
          fixedCount++;
        }
        if (f.type === 'string' && typeof data[f.key] === 'string') {
          data[f.key] = data[f.key].trim();
        }
      });

      return { ...row, data };
    });

    setStagingRows(revalidateAllRows(fixed));
    toast.success(`Applied auto-corrections across ${fixedCount} fields!`);
  };

  const handleRemoveErrorRows = () => {
    const validOnes = stagingRows.filter(r => r._status !== 'error');
    const removedCount = stagingRows.length - validOnes.length;
    if (removedCount === 0) {
      toast.info('No error rows to remove.');
      return;
    }
    setStagingRows(revalidateAllRows(validOnes));
    toast.success(`Removed ${removedCount} invalid rows.`);
  };

  // ==========================================
  // FINAL COMMIT HANDLER
  // ==========================================

  const handleFinalCommit = () => {
    if (!veracityConfirmed) {
      toast.error('Please acknowledge and confirm the veracity check before committing.');
      return;
    }

    if (stagingRows.length === 0) {
      toast.error('No rows available to import.');
      return;
    }

    if (validationSummary.errorCount > 0) {
      const confirmIgnore = window.confirm(
        `There are still ${validationSummary.errorCount} row(s) with fatal validation errors. If you continue, those invalid rows will be skipped. Do you wish to proceed?`
      );
      if (!confirmIgnore) return;
    }

    try {
      if (selectedEntity === 'boq_items' && onCommitItemTemplates) {
        const result = convertStagingToItemTemplates(
          stagingRows,
          existingData.itemTemplates || [],
          conflictMode
        );
        onCommitItemTemplates(result.newTemplates, result.summary.details);
      } else if (selectedEntity === 'clients' && onCommitClients) {
        const result = convertStagingToClients(
          stagingRows,
          existingData.clients || [],
          conflictMode
        );
        onCommitClients(result.newClients, result.summary.details);
      } else if (selectedEntity === 'projects' && onCommitProjects) {
        const result = convertStagingToProjects(
          stagingRows,
          existingData.projects || [],
          existingData.clients || [],
          conflictMode
        );
        onCommitProjects(result.newProjects, result.summary.details);
      } else if (selectedEntity === 'invoices' && onCommitInvoices) {
        const result = convertStagingToInvoices(
          stagingRows,
          existingData.invoices || [],
          existingData.clients || [],
          conflictMode
        );
        onCommitInvoices(result.newInvoices, result.summary.details);
      } else if (selectedEntity === 'personnel' && onCommitPersonnel) {
        const result = convertStagingToPersonnel(
          stagingRows,
          existingData.personnel || [],
          conflictMode
        );
        onCommitPersonnel(result.newPersonnel, result.summary.details);
      } else if (selectedEntity === 'equipment' && onCommitEquipment) {
        const result = convertStagingToEquipment(
          stagingRows,
          existingData.equipment || [],
          conflictMode
        );
        onCommitEquipment(result.newEquipment, result.summary.details);
      } else if (selectedEntity === 'boq_lines' && onCommitBOQLines) {
        const result = convertStagingToBOQLines(stagingRows);
        onCommitBOQLines(result.newBOQItems, result.summary.details);
      } else {
        toast.error(`Import handler for ${selectedEntity} is not configured.`);
        return;
      }

      toast.success('Data imported and committed successfully!');
      onClose();
      resetWizard();
    } catch (err: any) {
      toast.error(`Failed to commit import: ${err.message}`);
    }
  };

  // Filtered rows for editor
  const filteredStagingRows = useMemo(() => {
    let list = stagingRows;
    if (filterMode === 'errors') list = list.filter(r => r._status === 'error');
    else if (filterMode === 'warnings') list = list.filter(r => r._status === 'warning');
    else if (filterMode === 'valid') list = list.filter(r => r._status === 'valid');

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => {
        return Object.values(r.data).some(val => 
          val !== undefined && val !== null && String(val).toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [stagingRows, filterMode, searchQuery]);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className={cn(
          "bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-200",
          isFullScreen 
            ? "w-full h-full max-w-none max-h-none rounded-none" 
            : "w-full max-w-6xl max-h-[92vh] h-[92vh]"
        )}
      >
        {/* ========================================== */}
        {/* HEADER                                      */}
        {/* ========================================== */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Universal CSV & Excel Import Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Veracity Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Upload spreadsheets, inspect & edit staged data, verify veracity, and commit to system
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Step Badges */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 rounded-lg border border-slate-700 text-xs">
              <span className={cn("px-2 py-0.5 rounded font-medium", currentStep === 'SOURCE' ? "bg-sky-500 text-white" : "text-slate-400")}>
                1. Source
              </span>
              <span className="text-slate-600">→</span>
              <span className={cn("px-2 py-0.5 rounded font-medium", currentStep === 'MAPPING' ? "bg-sky-500 text-white" : "text-slate-400")}>
                2. Mapping
              </span>
              <span className="text-slate-600">→</span>
              <span className={cn("px-2 py-0.5 rounded font-medium", currentStep === 'EDITOR' ? "bg-sky-500 text-white" : "text-slate-400")}>
                3. Staging & Veracity
              </span>
              <span className="text-slate-600">→</span>
              <span className={cn("px-2 py-0.5 rounded font-medium", currentStep === 'CONFIRM' ? "bg-sky-500 text-white" : "text-slate-400")}>
                4. Commit
              </span>
            </div>

            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title={isFullScreen ? "Exit Fullscreen" : "Fullscreen Mode"}
            >
              {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ========================================== */}
        {/* SUB-HEADER / ENTITY PICKER BAR              */}
        {/* ========================================== */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Target Dataset:
            </span>
            <select
              value={selectedEntity}
              onChange={(e) => resetWizard(e.target.value as ImportEntityType)}
              disabled={currentStep !== 'SOURCE'}
              className="px-2.5 py-1 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden disabled:bg-slate-100 disabled:opacity-80"
            >
              {Object.entries(ENTITY_SCHEMAS).map(([key, schema]) => (
                <option key={key} value={key}>
                  {schema.label}
                </option>
              ))}
            </select>
            <span className="hidden sm:inline text-xs text-slate-500 italic">
              — {currentSchema.description}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Templates Button */}
            <div className="flex items-center rounded-lg border border-slate-300 bg-white shadow-2xs overflow-hidden text-xs font-medium text-slate-700">
              <span className="px-2.5 py-1 text-slate-500 flex items-center gap-1 border-r border-slate-200">
                <Download size={13} />
                <span>Template:</span>
              </span>
              <button
                type="button"
                onClick={() => downloadSampleTemplate(selectedEntity, 'xlsx')}
                className="px-2.5 py-1 hover:bg-emerald-50 hover:text-emerald-700 transition-colors border-r border-slate-200"
                title="Download pre-filled Excel template (.xlsx)"
              >
                Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => downloadSampleTemplate(selectedEntity, 'csv')}
                className="px-2.5 py-1 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                title="Download CSV format template (.csv)"
              >
                CSV
              </button>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* STEP 1: SOURCE SELECTION & UPLOAD          */}
        {/* ========================================== */}
        {currentStep === 'SOURCE' && (
          <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 flex flex-col justify-center max-w-4xl mx-auto w-full">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Step 1: Ingest Data for {currentSchema.label}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Drag and drop your spreadsheet file, browse from computer, or paste spreadsheet cells directly.
                  </p>
                </div>
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setSourceTab('upload')}
                    className={cn(
                      "px-3 py-1.5 rounded-md transition-all",
                      sourceTab === 'upload' ? "bg-white shadow-2xs text-slate-900 font-bold" : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    File Upload (.xlsx, .csv)
                  </button>
                  <button
                    onClick={() => setSourceTab('paste')}
                    className={cn(
                      "px-3 py-1.5 rounded-md transition-all",
                      sourceTab === 'paste' ? "bg-white shadow-2xs text-slate-900 font-bold" : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Paste Spreadsheet Cells
                  </button>
                </div>
              </div>

              {sourceTab === 'upload' ? (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleProcessFile(e.target.files[0]);
                      }
                    }}
                    accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    className="hidden"
                  />

                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleProcessFile(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3",
                      isDraggingFile 
                        ? "border-sky-500 bg-sky-50/60 scale-[1.01]" 
                        : "border-slate-300 hover:border-sky-400 hover:bg-slate-50/80"
                    )}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-sm">
                      {isParsing ? (
                        <RefreshCw className="animate-spin" size={28} />
                      ) : (
                        <UploadCloud size={32} />
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {isParsing ? 'Reading spreadsheet structure...' : 'Click to select or drag and drop spreadsheet file'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Supports Microsoft Excel (.xlsx, .xls), CSV (.csv), or comma-separated exports
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        Excel .XLSX
                      </span>
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-sky-100 text-sky-800">
                        CSV UTF-8
                      </span>
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-100 text-indigo-800">
                        Excel 97-2003 .XLS
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      Copy cells from Excel or Google Sheets and paste here:
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Include headers on the first line
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={"Item Code\tItem Name\tCategory\tUnit\tSelling Rate\nAL-WIN-01\t2-Track Sliding Window\tAluminium Works\tm²\t34500\nGL-PART-12\t12mm Tempered Glass Partition\tGlass & Glazing\tm²\t28500"}
                    className="w-full p-3 font-mono text-xs bg-slate-900 text-emerald-400 rounded-xl border border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleProcessPastedText}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2"
                    >
                      <Sparkles size={14} />
                      <span>Parse Pasted Data</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Field Reference Guide */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-2">
                  <Info size={14} className="text-sky-600" />
                  <span>Expected Columns for {currentSchema.label}:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {currentSchema.fields.map(f => (
                    <div key={f.key} className="flex items-center justify-between p-1.5 bg-white rounded-md border border-slate-200">
                      <span className="font-semibold text-slate-700">{f.label}</span>
                      {f.required ? (
                        <span className="text-[10px] font-bold text-red-600 uppercase">Required</span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Optional</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* STEP 2: COLUMN MAPPING                     */}
        {/* ========================================== */}
        {currentStep === 'MAPPING' && (
          <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Step 2: Column Mapping & Schema Matching
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Match headers from <span className="font-semibold text-slate-800">{uploadedFileName}</span> ({rawRows.length} rows) to target system fields.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep('SOURCE')}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Choose Different File</span>
                </button>
              </div>

              {/* Mapping Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100/75 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">File Header</th>
                      <th className="p-3">Preview Sample (Row 1)</th>
                      <th className="p-3">Map To Target Field</th>
                      <th className="p-3">Match Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {columnMappings.map((map, idx) => {
                      const sampleVal = rawRows[0] && rawRows[0][idx] !== undefined ? String(rawRows[0][idx]) : '—';
                      return (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="p-3 font-semibold text-slate-900">
                            {map.fileHeader}
                          </td>
                          <td className="p-3 text-slate-500 font-mono text-[11px] truncate max-w-[200px]" title={sampleVal}>
                            {sampleVal}
                          </td>
                          <td className="p-3">
                            <select
                              value={map.targetFieldKey}
                              onChange={(e) => {
                                const newKey = e.target.value;
                                setColumnMappings(prev => prev.map((m, i) => i === idx ? { ...m, targetFieldKey: newKey, confidence: newKey ? 1.0 : 0 } : m));
                              }}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                            >
                              <option value="">— Do Not Import / Skip —</option>
                              {currentSchema.fields.map(f => (
                                <option key={f.key} value={f.key}>
                                  {f.label} {f.required ? '(Required)' : ''}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3">
                            {map.targetFieldKey ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <CheckCircle2 size={12} />
                                <span>Mapped</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                Ignored
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Step 2 Bottom Navigation */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-500">
                  Required fields status: {
                    currentSchema.fields.filter(f => f.required).every(f => columnMappings.some(m => m.targetFieldKey === f.key)) ? (
                      <span className="text-emerald-700 font-bold">All required fields mapped ✓</span>
                    ) : (
                      <span className="text-amber-700 font-bold">Please ensure all required fields are mapped</span>
                    )
                  }
                </div>
                <button
                  type="button"
                  onClick={handleBuildStagingRows}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <span>Build Staging Table & Verify Veracity</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* STEP 3: INTERACTIVE STAGING & VERACITY      */}
        {/* ========================================== */}
        {currentStep === 'EDITOR' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-100">
            {/* Veracity Health Bar & Metrics */}
            <div className="px-5 py-3 bg-white border-b border-slate-200 shrink-0 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Score badge */}
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "px-3 py-1 rounded-xl border flex items-center gap-2",
                    validationSummary.veracityScore >= 85 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                      : validationSummary.veracityScore >= 60 
                        ? "bg-amber-50 border-amber-200 text-amber-800" 
                        : "bg-red-50 border-red-200 text-red-800"
                  )}>
                    <ShieldCheck size={18} className={validationSummary.veracityScore >= 85 ? "text-emerald-600" : "text-amber-600"} />
                    <div>
                      <div className="text-xs font-bold leading-none">
                        {validationSummary.veracityScore}% Veracity Score
                      </div>
                      <div className="text-[10px] opacity-75">
                        {validationSummary.errorCount === 0 ? 'Data integrity verified' : 'Requires review'}
                      </div>
                    </div>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                    <button
                      onClick={() => setFilterMode('all')}
                      className={cn(
                        "px-2.5 py-1 rounded-md transition-all",
                        filterMode === 'all' ? "bg-white shadow-2xs text-slate-900" : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      All ({validationSummary.totalRows})
                    </button>
                    <button
                      onClick={() => setFilterMode('errors')}
                      className={cn(
                        "px-2.5 py-1 rounded-md transition-all flex items-center gap-1",
                        filterMode === 'errors' ? "bg-red-50 text-red-700 font-bold shadow-2xs" : "text-slate-600 hover:text-red-700"
                      )}
                    >
                      <AlertCircle size={12} className="text-red-600" />
                      <span>Errors ({validationSummary.errorCount})</span>
                    </button>
                    <button
                      onClick={() => setFilterMode('warnings')}
                      className={cn(
                        "px-2.5 py-1 rounded-md transition-all flex items-center gap-1",
                        filterMode === 'warnings' ? "bg-amber-50 text-amber-700 font-bold shadow-2xs" : "text-slate-600 hover:text-amber-700"
                      )}
                    >
                      <AlertTriangle size={12} className="text-amber-600" />
                      <span>Warnings ({validationSummary.warningCount})</span>
                    </button>
                    <button
                      onClick={() => setFilterMode('valid')}
                      className={cn(
                        "px-2.5 py-1 rounded-md transition-all flex items-center gap-1",
                        filterMode === 'valid' ? "bg-emerald-50 text-emerald-700 font-bold shadow-2xs" : "text-slate-600 hover:text-emerald-700"
                      )}
                    >
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      <span>Valid ({validationSummary.validCount})</span>
                    </button>
                  </div>
                </div>

                {/* Batch Action Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search rows..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg w-40 focus:w-56 transition-all focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddNewManualRow}
                    className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5"
                    title="Insert new row"
                  >
                    <Plus size={13} className="text-sky-600" />
                    <span>Add Row</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAutoFixIssues}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5"
                    title="Auto-generate missing primary keys and fix negative values"
                  >
                    <Sparkles size={13} className="text-indigo-600" />
                    <span>Auto-Fix</span>
                  </button>

                  {validationSummary.errorCount > 0 && (
                    <button
                      type="button"
                      onClick={handleRemoveErrorRows}
                      className="px-2.5 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5"
                      title="Purge invalid rows from batch"
                    >
                      <Trash2 size={13} className="text-red-600" />
                      <span>Purge Errors</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Interactive Data Grid */}
            <div className="flex-1 overflow-auto p-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-800 text-white font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5 w-12 text-center">#</th>
                      <th className="p-2.5 w-24">Veracity</th>
                      {currentSchema.fields.map(field => (
                        <th key={field.key} className="p-2.5 min-w-[140px]">
                          <div className="flex items-center gap-1">
                            <span>{field.label}</span>
                            {field.required && <span className="text-red-400">*</span>}
                          </div>
                        </th>
                      ))}
                      <th className="p-2.5 w-20 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-sans">
                    {filteredStagingRows.length === 0 ? (
                      <tr>
                        <td colSpan={currentSchema.fields.length + 3} className="p-8 text-center text-slate-500">
                          No rows match the active filter or search query.
                        </td>
                      </tr>
                    ) : (
                      filteredStagingRows.map((row, rowIdx) => {
                        const hasErrors = Object.keys(row._errors).length > 0;
                        const hasWarnings = Object.keys(row._warnings).length > 0;

                        return (
                          <tr 
                            key={row._rowId}
                            className={cn(
                              "transition-colors",
                              hasErrors 
                                ? "bg-red-50/50 hover:bg-red-50" 
                                : hasWarnings 
                                  ? "bg-amber-50/30 hover:bg-amber-50/60" 
                                  : "hover:bg-slate-50/80"
                            )}
                          >
                            {/* Row Index */}
                            <td className="p-2 text-center text-[11px] text-slate-400 font-mono">
                              {rowIdx + 1}
                            </td>

                            {/* Veracity Status Badge */}
                            <td className="p-2">
                              {hasErrors ? (
                                <div 
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full"
                                  title={Object.values(row._errors).join(' | ')}
                                >
                                  <AlertCircle size={11} />
                                  <span>ERROR</span>
                                </div>
                              ) : hasWarnings ? (
                                <div 
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full"
                                  title={Object.values(row._warnings).join(' | ')}
                                >
                                  <AlertTriangle size={11} />
                                  <span>WARNING</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  <Check size={11} />
                                  <span>VERIFIED</span>
                                </div>
                              )}
                            </td>

                            {/* Editable Fields */}
                            {currentSchema.fields.map(field => {
                              const cellValue = row.data[field.key] !== undefined ? row.data[field.key] : '';
                              const fieldError = row._errors[field.key];
                              const fieldWarning = row._warnings[field.key];

                              return (
                                <td 
                                  key={field.key}
                                  className={cn(
                                    "p-1.5 border-r border-slate-100 relative group",
                                    fieldError ? "bg-red-100/50" : fieldWarning ? "bg-amber-100/30" : ""
                                  )}
                                >
                                  {field.type === 'select' && field.options ? (
                                    <select
                                      value={cellValue}
                                      onChange={(e) => handleCellChange(row._rowId, field.key, e.target.value)}
                                      className={cn(
                                        "w-full px-2 py-1 bg-transparent rounded text-xs border focus:outline-hidden focus:ring-1 focus:ring-sky-500",
                                        fieldError ? "border-red-400 text-red-900" : "border-slate-200"
                                      )}
                                    >
                                      {field.options.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type={field.type === 'number' ? 'number' : 'text'}
                                      value={cellValue}
                                      onChange={(e) => {
                                        const val = field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
                                        handleCellChange(row._rowId, field.key, val);
                                      }}
                                      className={cn(
                                        "w-full px-2 py-1 rounded text-xs border transition-all focus:outline-hidden focus:ring-1 focus:bg-white",
                                        fieldError 
                                          ? "border-red-400 bg-red-50 text-red-900 focus:ring-red-500 font-semibold" 
                                          : fieldWarning
                                            ? "border-amber-300 bg-amber-50/50 text-amber-900 focus:ring-amber-500"
                                            : "border-transparent hover:border-slate-200 bg-transparent focus:border-sky-400 focus:ring-sky-500"
                                      )}
                                    />
                                  )}

                                  {/* Error / Warning Hover Indicator */}
                                  {(fieldError || fieldWarning) && (
                                    <div className="absolute right-2 top-2.5 pointer-events-none">
                                      {fieldError ? (
                                        <AlertCircle size={13} className="text-red-600" />
                                      ) : (
                                        <AlertTriangle size={13} className="text-amber-600" />
                                      )}
                                    </div>
                                  )}
                                </td>
                              );
                            })}

                            {/* Row Actions */}
                            <td className="p-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateRow(row)}
                                  className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                                  title="Duplicate row"
                                >
                                  <Copy size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStagingRow(row._rowId)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                                  title="Delete row"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Step 3 Footer Navigation */}
            <div className="px-5 py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('MAPPING')}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft size={13} />
                  <span>Back to Mapping</span>
                </button>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-semibold">Conflict Strategy:</span>
                  <select
                    value={conflictMode}
                    onChange={(e) => setConflictMode(e.target.value as ConflictResolutionMode)}
                    className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-md text-xs font-semibold text-slate-800"
                  >
                    <option value="UPSERT">Update / Overwrite Matching Records</option>
                    <option value="INSERT_ONLY">Skip Existing Records (Keep Current)</option>
                    <option value="RENAME_NEW">Create Copies with Suffix (-IMP)</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep('CONFIRM')}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <span>Proceed to Veracity Confirmation</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* STEP 4: VERACITY CONFIRMATION & COMMIT     */}
        {/* ========================================== */}
        {currentStep === 'CONFIRM' && (
          <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 flex flex-col justify-center max-w-3xl mx-auto w-full">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={22} className="text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Step 4: Confirm Validity, Veracity & Commit
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review the final import metrics for <span className="font-semibold text-slate-800">{currentSchema.label}</span> before writing to live state.
                </p>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-semibold">Total Staged</div>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    {validationSummary.totalRows}
                  </div>
                  <div className="text-[11px] text-slate-400">Rows processed</div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="text-xs text-emerald-800 font-semibold">Verified Valid</div>
                  <div className="text-xl font-black text-emerald-700 mt-1">
                    {validationSummary.validCount}
                  </div>
                  <div className="text-[11px] text-emerald-600">Passed all checks</div>
                </div>

                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-xs text-blue-800 font-semibold">DB Matches</div>
                  <div className="text-xl font-black text-blue-700 mt-1">
                    {validationSummary.existingMatchCount}
                  </div>
                  <div className="text-[11px] text-blue-600">
                    {conflictMode === 'UPSERT' ? 'Will update' : conflictMode === 'INSERT_ONLY' ? 'Will skip' : 'Will suffix'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-semibold">Overall Veracity</div>
                  <div className="text-xl font-black text-indigo-700 mt-1">
                    {validationSummary.veracityScore}%
                  </div>
                  <div className="text-[11px] text-slate-400">Integrity score</div>
                </div>
              </div>

              {/* Veracity Checklist Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <div className="text-xs font-bold text-slate-800">
                  System Pre-Import Veracity Audit:
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 size={14} />
                    <span>Schema and primary key uniqueness validated</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 size={14} />
                    <span>Numeric pricing, rates, and unit formats normalized</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 size={14} />
                    <span>Selected conflict strategy: <strong>{conflictMode}</strong></span>
                  </div>
                  {validationSummary.errorCount > 0 && (
                    <div className="flex items-center gap-2 text-red-600 font-semibold">
                      <AlertCircle size={14} />
                      <span>Notice: {validationSummary.errorCount} row(s) with fatal errors will be automatically skipped upon commit.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* User Confirmation Checkbox */}
              <label className="flex items-start gap-3 p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors">
                <input
                  type="checkbox"
                  checked={veracityConfirmed}
                  onChange={(e) => setVeracityConfirmed(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-emerald-950 block">
                    Veracity & Authenticity Declaration
                  </span>
                  <span className="text-emerald-800">
                    I confirm that I have inspected, edited, and verified the accuracy and veracity of these imported records and authorize committing them into the operational system database.
                  </span>
                </div>
              </label>

              {/* Step 4 Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep('EDITOR')}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Return to Table Editor</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinalCommit}
                  disabled={!veracityConfirmed}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <ShieldCheck size={16} />
                  <span>Confirm Validity & Commit Import</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
