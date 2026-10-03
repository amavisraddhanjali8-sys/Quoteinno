import React, { useState, useMemo, useEffect } from 'react';
import { Project, BOQItem, VariationStatus, AuditLog, PaymentTier, Term, Timeline, Quote, QuoteStatus, CompanySettings } from '../types';
import { Plus, Trash2, Download, ArrowLeft, Save, FileText, AlertCircle, PlusCircle, MinusCircle, History, CreditCard, Calendar, Clock, User, FileCode, Sparkles, DollarSign, ExternalLink, ChevronRight, Scale, TrendingUp, Briefcase } from 'lucide-react';
import { BOQTable } from './BOQTable';
import { ConfirmationModal } from './ConfirmationModal';
import { TermsEditor } from './TermsEditor';
import { TimelineEditor } from './TimelineEditor';
import { ProjectHistory } from './ProjectHistory';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { enhanceProjectNotes } from '../services/geminiService';
import { Invoice, Payment, Adjustment } from '../types';

interface ProjectVariationEditorProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onBack: () => void;
  onGenerateVariationReport: (project: Project) => void;
  onOpenCatalog: () => void;
  onDeleteProject: (id: string) => void;
  initialTab?: 'overview' | 'variations' | 'payments' | 'audit' | 'documents' | 'history';
  settings?: CompanySettings;
  quotes?: Quote[];
  invoices?: Invoice[];
  payments?: Payment[];
  adjustments?: Adjustment[];
  onViewItem?: (type: 'Quote' | 'Invoice' | 'Payment' | 'Adjustment' | 'Variation' | 'Report' | 'Accounting Report', id: string) => void;
  onNavigateToPortal?: (portal: 'invoices' | 'accounting', filters?: any) => void;
  onNavigateToPostEvaluation?: () => void;
}

export const ProjectVariationEditor: React.FC<ProjectVariationEditorProps> = ({ 
  project, 
  onUpdateProject, 
  onBack,
  onGenerateVariationReport,
  onOpenCatalog,
  onDeleteProject,
  initialTab = 'overview',
  settings,
  quotes = [],
  invoices = [],
  payments = [],
  adjustments = [],
  onViewItem,
  onNavigateToPortal,
  onNavigateToPostEvaluation
}) => {
  const [items, setItems] = useState<BOQItem[]>(project.items);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(project.auditLogs || []);
  const [paymentTiers, setPaymentTiers] = useState<PaymentTier[]>(project.paymentTiers || []);
  const [terms, setTerms] = useState<Term[]>(project.terms || []);
  const [timeline, setTimeline] = useState<Timeline | undefined>(project.timeline);
  const [notes, setNotes] = useState(project.notes || '');
  const [activeTab, setActiveTab] = useState<'all' | 'original' | 'additional' | 'omitted'>('all');
  const [mainTab, setMainTab] = useState<'overview' | 'variations' | 'payments' | 'audit' | 'documents' | 'history'>(initialTab);
  const [isRecording, setIsRecording] = useState(false);
  const [isEnhancingNotes, setIsEnhancingNotes] = useState(false);
  const [sessionLogs, setSessionLogs] = useState<string[]>([]);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [showDeleteProjectConfirm, setShowDeleteProjectConfirm] = useState(false);

  // Synchronize mainTab when initialTab prop updates from navigation sub-bar
  useEffect(() => {
    if (initialTab) {
      setMainTab(initialTab);
    }
  }, [initialTab]);

  // Synchronize internal state when active project changes from dropdown
  useEffect(() => {
    setItems(project.items || []);
    setAuditLogs(project.auditLogs || []);
    setPaymentTiers(project.paymentTiers || []);
    setTerms(project.terms || []);
    setTimeline(project.timeline);
    setNotes(project.notes || '');
  }, [project.id]);

  const projectFiles = useMemo(() => {
    const files: any[] = [];
    
    // Original Quote
    files.push({
      id: project.quoteId || project.id,
      name: `Original Quote ${project.originalQuoteNo || 'Project'}`,
      type: 'Quote',
      date: project.startDate,
      icon: <FileText size={16} className="text-blue-500" />,
      action: () => onViewItem?.('Quote', project.quoteId || project.id)
    });

    // Invoices
    invoices.filter(i => i.projectId === project.id).forEach(i => {
      files.push({
        id: i.id,
        name: `Invoice ${i.invoiceNo}`,
        type: 'Invoice',
        date: i.createdAt,
        icon: <FileCode size={16} className="text-amber-500" />,
        action: () => onViewItem?.('Invoice', i.id)
      });
    });

    // Payments
    payments.filter(p => p.projectId === project.id).forEach(p => {
      files.push({
        id: p.id,
        name: `Payment Receipt ${p.paymentNo}`,
        type: 'Payment',
        date: p.date,
        icon: <CreditCard size={16} className="text-emerald-500" />,
        action: () => onViewItem?.('Payment', p.id)
      });
    });

    // Adjustments
    adjustments.filter(a => a.projectId === project.id).forEach(a => {
      files.push({
        id: a.id,
        name: `Adjustment: ${a.type}`,
        type: 'Adjustment',
        date: a.date,
        icon: <DollarSign size={16} className="text-rose-500" />,
        action: () => onViewItem?.('Adjustment', a.id)
      });
    });

    // Variations & Accounting (Audit Logs)
    (project.auditLogs || []).forEach(log => {
      if (log.type === 'Variation') {
        files.push({
          id: log.id,
          name: `Variation: ${log.action}`,
          type: 'Variation',
          date: log.timestamp,
          icon: <PlusCircle size={16} className="text-indigo-500" />,
          action: () => onViewItem?.('Variation', log.id)
        });
      } else if (log.type === 'Accounting') {
        files.push({
          id: log.id,
          name: `Accounting: ${log.action}`,
          type: 'Accounting Report',
          date: log.timestamp,
          icon: <FileCode size={16} className="text-slate-500" />,
          action: () => onViewItem?.('Accounting Report', log.id)
        });
      }
    });

    // Reports
    (project.reports || []).forEach(report => {
      files.push({
        id: report.id,
        name: `Report: ${report.title}`,
        type: 'Report',
        date: report.createdAt,
        icon: <FileText size={16} className="text-purple-500" />,
        action: () => onViewItem?.('Report', report.id)
      });
    });

    return files.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [project, invoices, payments, adjustments, onViewItem]);

  useEffect(() => {
    setItems(project.items);
  }, [project.items]);

  useEffect(() => {
    if (initialTab) {
      setMainTab(initialTab);
    }
  }, [initialTab]);

  const addLog = (action: string, details: string, type: AuditLog['type'] = 'Variation') => {
    const newLog: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action,
      details,
      user: 'Current User', // In a real app, this would be the logged-in user
      type
    };
    setAuditLogs(prev => [newLog, ...prev]);
    if (isRecording) {
      setSessionLogs(prev => [...prev, `${action}: ${details}`]);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setSessionLogs([]);
    addLog('Recording Started', 'Started a new variation recording session.', 'General');
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (sessionLogs.length > 0) {
      addLog('Variation Committed', `Committed a session with ${sessionLogs.length} changes.`, 'Variation');
    } else {
      addLog('Recording Stopped', 'Stopped recording session with no changes.', 'General');
    }
  };

  const handleEnhanceNotes = async () => {
    setIsEnhancingNotes(true);
    try {
      const enhanced = await enhanceProjectNotes(project.projectName, notes);
      setNotes(enhanced);
    } finally {
      setIsEnhancingNotes(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return items;
    if (activeTab === 'original') return items.filter(i => i.variationStatus === 'Original');
    if (activeTab === 'additional') return items.filter(i => i.variationStatus === 'Additional');
    if (activeTab === 'omitted') return items.filter(i => i.variationStatus === 'Omitted');
    return items;
  }, [items, activeTab]);

  // originalTotal includes omitted items, so we subtract them

  // Actually, originalTotal should probably be the sum of items that were originally there.
  // If an item is omitted, it's still part of the "Original Sum" but subtracted in "Omissions".
  // Let's refine the totals:
  const totals = useMemo(() => {
    // Helper to determine if an item should be included in the total calculation
    // We only sum "leaf" items: Sub items, or Main items that have no sub-items.
    // Title items are never summed.
    const isLeafItem = (item: BOQItem, index: number, allItems: BOQItem[]) => {
      if (item.itemType === 'Title') return false;
      if (item.itemType === 'Sub') return true;
      if (item.itemType === 'Main') {
        // Check if it has any sub-items
        const nextItem = allItems[index + 1];
        return !nextItem || nextItem.itemType !== 'Sub';
      }
      return true;
    };

    const leafItems = items.filter((item, index) => isLeafItem(item, index, items));

    // Use stored originalSum if available, otherwise calculate it
    // originalSum should include items that are now omitted
    const original = project.originalSum ?? leafItems
      .filter(i => i.variationStatus !== 'Additional')
      .reduce((sum, i) => sum + i.amount, 0);
    
    const additional = leafItems
      .filter(i => i.variationStatus === 'Additional')
      .reduce((sum, i) => sum + i.amount, 0);
      
    const omitted = leafItems
      .filter(i => i.variationStatus === 'Omitted')
      .reduce((sum, i) => sum + i.amount, 0);
      
    const netVariation = additional - omitted;
    // Revised subtotal is the original sum plus additions minus omissions
    // Since 'original' already includes 'omitted' items' values, we just add netVariation
    const revisedSubtotal = original + netVariation;
    
    // Apply project-level discounts and taxes
    const discountPercent = project.discountPercent || 0;
    const discountAmount = revisedSubtotal * (discountPercent / 100);
    
    const additionalChargesTotal = project.additionalCharges?.reduce((sum, c) => sum + c.amount, 0) || 0;
    const totalBeforeTax = revisedSubtotal - discountAmount + additionalChargesTotal;
    
    const taxPercent = project.taxPercent || 0;
    const taxAmount = project.isTaxInclusive ? 0 : totalBeforeTax * (taxPercent / 100);
    const finalTotal = totalBeforeTax + taxAmount;
      
    return {
      original,
      additional,
      omitted,
      netVariation,
      revisedSubtotal,
      discountAmount,
      additionalChargesTotal,
      taxAmount,
      finalTotal
    };
  }, [items, project.discountPercent, project.taxPercent, project.isTaxInclusive, project.additionalCharges]);

  const handleItemsChange = (newFilteredItems: BOQItem[]) => {
    if (activeTab === 'all') {
      setItems(newFilteredItems);
    } else {
      // Merge changes from the filtered subset back into the main list
      // This handles updates, deletions, and additions
      const updatedItems: BOQItem[] = [];
      const newFilteredIds = new Set(newFilteredItems.map(i => i.id));
      
      // 1. Keep items NOT in the current filter
      // 2. Replace items IN the current filter with the new versions
      // 3. Add any NEW items from newFilteredItems
      
      items.forEach(item => {
        const isInFilter = (activeTab === 'original' && (item.variationStatus === 'Original' || item.variationStatus === 'Omitted')) ||
                           (activeTab === 'additional' && item.variationStatus === 'Additional') ||
                           (activeTab === 'omitted' && item.variationStatus === 'Omitted');
        
        if (isInFilter) {
          // This item was in the filter. If it's still in the new list, use the new version in order.
          // Actually, we should follow the order from newFilteredItems for items in the filter.
          // But we need to know WHERE to insert them.
          // For simplicity, we'll keep the original positions for existing items.
        } else {
          updatedItems.push(item);
        }
      });

      // This is still tricky. Let's just do a simple replacement for now.
      // If the user is filtering, they probably aren't reordering across the whole list.
      const finalItems = [...items];
      
      // Remove items that were in the filter but are now gone
      const itemsToRemove = items.filter(i => {
        const isInFilter = (activeTab === 'original' && (i.variationStatus === 'Original' || i.variationStatus === 'Omitted')) ||
                           (activeTab === 'additional' && i.variationStatus === 'Additional') ||
                           (activeTab === 'omitted' && i.variationStatus === 'Omitted');
        return isInFilter && !newFilteredIds.has(i.id);
      });
      
      const filteredResult = finalItems.filter(i => !itemsToRemove.some(rem => rem.id === i.id));
      
      // Update existing items and add new ones
      newFilteredItems.forEach(newItem => {
        const index = filteredResult.findIndex(i => i.id === newItem.id);
        if (index !== -1) {
          filteredResult[index] = newItem;
        } else {
          filteredResult.push(newItem);
        }
      });
      
      setItems(filteredResult);
    }
    addLog('Items Updated', `Updated ${newFilteredItems.length} items in the BOQ.`, 'Variation');
  };

  const handleMoveItem = (id: string, direction: 'up' | 'down') => {
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newItems = [...items];
    const [movedItem] = newItems.splice(index, 1);
    newItems.splice(newIndex, 0, movedItem);
    
    setItems(newItems);
    addLog('Item Moved', `Moved item "${movedItem.name}" ${direction}`, 'Variation');
  };

  const handleDeleteItem = (id: string) => {
    setItemToDelete(id);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    const item = items.find(i => i.id === itemToDelete);
    if (!item) return;

    const newItems = items.filter(i => i.id !== itemToDelete);
    setItems(newItems);
    addLog('Item Deleted', `Deleted item: ${item.name}`, 'Variation');
    setItemToDelete(null);
  };

  const handleDuplicateItem = (id: string) => {
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return;
    
    const item = items[index];
    const newItemId = crypto.randomUUID();
    const newItem = { 
      ...item, 
      id: newItemId,
      measurements: item.measurements ? { ...item.measurements, id: crypto.randomUUID() } : undefined,
      itemCharges: item.itemCharges?.map(c => ({ ...c, id: crypto.randomUUID() })),
      specification: item.specification ? JSON.parse(JSON.stringify(item.specification)) : undefined,
      variationStatus: 'Additional' as VariationStatus
    };
    
    const newItems = [...items];
    newItems.splice(index + 1, 0, newItem);
    
    setItems(newItems);
    addLog('Item Duplicated', `Duplicated item "${item.name}" as a variation`, 'Variation');
  };

  const handleInsertItem = (type: 'Title' | 'Main' | 'Sub', index: number) => {
    const newItemId = crypto.randomUUID();
    const newItem: BOQItem = {
      id: newItemId,
      no: '',
      name: `New ${type} Item`,
      description: '',
      itemType: type,
      category: 'Aluminium',
      unit: type === 'Title' ? 'None' : 'sqft',
      qty: type === 'Title' ? 0 : 1,
      rate: 0,
      discountPercent: 0,
      amount: 0,
      variationStatus: 'Additional'
    };
    
    const newItems = [...items];
    newItems.splice(index + 1, 0, newItem);
    
    setItems(newItems);
    addLog('Item Inserted', `Inserted new ${type} item: ${newItem.name}`, 'Variation');
  };

  const handleSave = () => {
    onUpdateProject({
      ...project,
      items,
      auditLogs,
      paymentTiers,
      notes,
      terms,
      timeline,
      totalValue: totals.finalTotal
    });
    addLog('Project Saved', `Saved all changes including ${items.length} items, ${paymentTiers.length} payment tiers, and document updates.`, 'General');
  };

  const addAdditionalItem = () => {
    const newItem: BOQItem = {
      id: crypto.randomUUID(),
      no: `VO-${items.filter(i => i.variationStatus === 'Additional').length + 1}`,
      name: 'New Additional Item',
      description: '',
      itemType: 'Main',
      category: 'Aluminium',
      unit: 'Nos',
      qty: 1,
      rate: 0,
      discountPercent: 0,
      amount: 0,
      variationStatus: 'Additional'
    };
    setItems([...items, newItem]);
    addLog('Item Added', `Added new additional item: ${newItem.name}`, 'Variation');
  };

  const toggleOmitItem = (id: string) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const isOmitted = item.variationStatus === 'Omitted';
        const newStatus: VariationStatus = isOmitted ? 'Original' : 'Omitted';
        addLog(isOmitted ? 'Item Restored' : 'Item Omitted', `${isOmitted ? 'Restored' : 'Omitted'} item: ${item.name}`, 'Variation');
        return { ...item, variationStatus: newStatus };
      }
      return item;
    }));
  };

  const addPaymentTier = () => {
    const newTier: PaymentTier = {
      id: crypto.randomUUID(),
      phase: `Phase ${paymentTiers.length + 1}`,
      percentage: 0,
      amount: 0,
      status: 'Pending'
    };
    setPaymentTiers([...paymentTiers, newTier]);
    addLog('Payment Tier Added', `Added new payment tier: ${newTier.phase}`, 'General');
  };

  // Keep payment tier amounts in sync with the final total
  useEffect(() => {
    setPaymentTiers(prev => prev.map(tier => ({
      ...tier,
      amount: (totals.finalTotal * tier.percentage) / 100
    })));
  }, [totals.finalTotal]);

  const updatePaymentTier = (id: string, field: keyof PaymentTier, value: any) => {
    setPaymentTiers(paymentTiers.map(tier => {
      if (tier.id === id) {
        const updatedTier = { ...tier, [field]: value };
        if (field === 'percentage') {
          updatedTier.amount = (totals.finalTotal * (parseFloat(value) || 0)) / 100;
        }
        return updatedTier;
      }
      return tier;
    }));
  };

  const removePaymentTier = (id: string) => {
    const tier = paymentTiers.find(t => t.id === id);
    setPaymentTiers(paymentTiers.filter(t => t.id !== id));
    if (tier) addLog('Payment Tier Removed', `Removed payment tier: ${tier.phase}`, 'General');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight">{project.projectName}</h1>
            <p className="text-[10px] text-slate-400 font-bold tracking-widest">
              Variation Order Management & Recalculation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isRecording ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg"
            >
              <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-rose-600 tracking-tight">Recording variation...</span>
              <button 
                onClick={stopRecording}
                className="ml-2 bg-rose-600 text-white px-3 py-1 rounded-md text-[9px] font-bold tracking-tight hover:bg-rose-700 transition-all"
              >
                Stop & commit
              </button>
            </motion.div>
          ) : (
            <button 
              onClick={startRecording}
              className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-[10px] font-bold tracking-tight hover:bg-slate-200 transition-all"
            >
              <Clock size={14} /> Record variation
            </button>
          )}
          {onNavigateToPostEvaluation && (
            <button 
              onClick={onNavigateToPostEvaluation}
              className="py-2 px-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold tracking-tight hover:bg-emerald-100 transition-all flex items-center gap-1.5"
              title="Open Standard Cost vs Actual Cost Variance & Post-Evaluation Engine"
            >
              <Scale size={14} className="text-emerald-600" /> Post-Evaluation Engine
            </button>
          )}
          <button 
            onClick={() => onGenerateVariationReport({ ...project, items, terms, timeline, notes })}
            className="btn-secondary py-2 px-4 text-[10px] font-bold tracking-tight flex items-center gap-2"
          >
            <Download size={14} /> Variation report
          </button>
          <button 
            onClick={handleSave}
            className="btn-primary py-2 px-6 text-[10px] font-bold tracking-tight flex items-center gap-2"
          >
            <Save size={14} /> Save changes
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
        <button 
          onClick={() => setMainTab('overview')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold tracking-tight transition-all",
            mainTab === 'overview' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <FileText size={14} /> Overview
        </button>
        <button 
          onClick={() => setMainTab('variations')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold tracking-tight transition-all",
            mainTab === 'variations' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <PlusCircle size={14} /> Variations
        </button>
        <button 
          onClick={() => setMainTab('payments')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold tracking-tight transition-all",
            mainTab === 'payments' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <CreditCard size={14} /> Payment tiers
        </button>
        <button 
          onClick={() => setMainTab('audit')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold tracking-tight transition-all",
            mainTab === 'audit' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <History size={14} /> Audit log
        </button>
        <button 
          onClick={() => setMainTab('history')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold tracking-tight transition-all",
            mainTab === 'history' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Clock size={14} /> History
        </button>
        <button 
          onClick={() => setMainTab('documents')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold tracking-tight transition-all",
            mainTab === 'documents' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <FileText size={14} /> Files
        </button>
        {onNavigateToPostEvaluation && (
          <button 
            onClick={onNavigateToPostEvaluation}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold tracking-tight text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all border border-emerald-200/60"
            title="Open Standard Cost vs Actual Cost Variance & Post-Evaluation Engine"
          >
            <Scale size={14} className="text-emerald-600" /> Post-Evaluation & Variances
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {mainTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold tracking-tight text-slate-400 flex items-center gap-2">
                      <FileText size={14} /> Project description & notes
                    </h3>
                    <button
                      onClick={handleEnhanceNotes}
                      disabled={isEnhancingNotes}
                      className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all disabled:opacity-50"
                    >
                      <Sparkles size={12} className={isEnhancingNotes ? "animate-pulse" : ""} />
                      {isEnhancingNotes ? "Enhancing..." : "AI Enhance"}
                    </button>
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter project details, site conditions, special requirements..."
                    className="w-full h-64 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all resize-none"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold tracking-tight text-slate-400 mb-4 flex items-center gap-2">
                    <User size={14} /> Client information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[8px] tracking-wider text-slate-400 font-bold">Name</p>
                      <p className="text-xs font-bold">{project.client.name}</p>
                    </div>
                    <div>
                      <p className="text-[8px] tracking-wider text-slate-400 font-bold">Email</p>
                      <p className="text-xs font-bold">{project.client.email}</p>
                    </div>
                    <div>
                      <p className="text-[8px] tracking-wider text-slate-400 font-bold">Phone</p>
                      <p className="text-xs font-bold">{project.client.phone}</p>
                    </div>
                    <div>
                      <p className="text-[8px] tracking-wider text-slate-400 font-bold">Address</p>
                      <p className="text-xs font-bold">{project.client.address}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-600 p-6 rounded-xl text-white shadow-lg shadow-blue-600/20">
                  <h3 className="text-[10px] font-bold tracking-tight opacity-60 mb-4">Financial summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] font-bold tracking-wider opacity-60">Original Sum</span>
                      <span className="text-sm font-bold font-mono">LKR {totals.original.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] font-bold tracking-wider opacity-60">Net Variations</span>
                      <span className={cn(
                        "text-sm font-bold font-mono",
                        totals.netVariation >= 0 ? "text-emerald-300" : "text-rose-300"
                      )}>
                        {totals.netVariation >= 0 ? '+' : ''}LKR {totals.netVariation.toLocaleString()}
                      </span>
                    </div>
                    <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                      <span className="text-[10px] font-bold tracking-widest">Revised Total</span>
                      <span className="text-xl font-bold font-mono">LKR {totals.finalTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold tracking-tight text-slate-400 mb-4 flex items-center gap-2">
                    <ExternalLink size={14} /> Related portals
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    <button 
                      onClick={() => onNavigateToPortal?.('invoices', { projectId: project.id })}
                      className="flex items-center justify-between p-3 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-2xl transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-blue-100">
                          <FileText size={14} />
                        </div>
                        <span className="text-xs font-bold tracking-widest">Linked Invoices</span>
                      </div>
                      <ChevronRight size={14} />
                    </button>
                    <button 
                      onClick={() => onNavigateToPortal?.('accounting', { projectId: project.id, tab: 'payments' })}
                      className="flex items-center justify-between p-3 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-2xl transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-emerald-100">
                          <DollarSign size={14} />
                        </div>
                        <span className="text-xs font-bold tracking-widest">Payment Records</span>
                      </div>
                      <ChevronRight size={14} />
                    </button>
                    <button 
                      onClick={() => onNavigateToPortal?.('accounting', { projectId: project.id, tab: 'adjustments' })}
                      className="flex items-center justify-between p-3 bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-600 rounded-2xl transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-amber-100">
                          <Scale size={14} />
                        </div>
                        <span className="text-xs font-bold tracking-widest">Adjustments</span>
                      </div>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-rose-100 shadow-sm">
                  <h3 className="text-xs font-bold tracking-tight text-rose-400 mb-4 flex items-center gap-2">
                    <AlertCircle size={14} /> Danger zone
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold tracking-tight mb-4">
                    Once you delete a project, there is no going back. Please be certain.
                  </p>
                  <button 
                    onClick={() => setShowDeleteProjectConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-bold tracking-widest hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
                  >
                    <Trash2 size={14} /> Delete Project
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {mainTab === 'variations' && (
          <motion.div
            key="variations"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            <div className="lg:col-span-9 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] text-slate-400 font-bold tracking-widest mb-1">Original Sum</p>
                  <p className="text-lg font-bold text-slate-900 font-mono">{project.currency || 'LKR'} {totals.original.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] text-emerald-500 font-bold tracking-widest mb-1 flex items-center gap-1">
                    <PlusCircle size={10} /> Additions
                  </p>
                  <p className="text-lg font-bold text-emerald-600 font-mono">{project.currency || 'LKR'} {totals.additional.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] text-rose-500 font-bold tracking-widest mb-1 flex items-center gap-1">
                    <MinusCircle size={10} /> Omissions
                  </p>
                  <p className="text-lg font-bold text-rose-600 font-mono">{project.currency || 'LKR'} {totals.omitted.toLocaleString()}</p>
                </div>
                <div className="bg-slate-800 p-4 rounded-2xl shadow-lg shadow-slate-800/20">
                  <p className="text-[9px] text-slate-400 font-bold tracking-widest mb-1">Revised Contract Sum</p>
                  <p className="text-lg font-bold text-white font-mono">{project.currency || 'LKR'} {totals.finalTotal.toLocaleString()}</p>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-[10px] font-bold tracking-widest text-slate-900 mb-4">Variation Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">Original Subtotal</span>
                      <span className="font-mono font-bold">{totals.original.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-emerald-600">Net Variation</span>
                      <span className={cn("font-mono font-bold", totals.netVariation >= 0 ? "text-emerald-600" : "text-rose-600")}>
                        {totals.netVariation >= 0 ? '+' : ''}{totals.netVariation.toLocaleString()}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-50 flex justify-between text-[10px] font-bold">
                      <span>Revised Subtotal</span>
                      <span className="font-mono">{totals.revisedSubtotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {project.discountPercent ? (
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">Discount ({project.discountPercent}%)</span>
                        <span className="font-mono font-bold text-rose-600">-{totals.discountAmount.toLocaleString()}</span>
                      </div>
                    ) : null}
                    {project.additionalCharges?.length ? (
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">Additional Charges</span>
                        <span className="font-mono font-bold">+{totals.additionalChargesTotal.toLocaleString()}</span>
                      </div>
                    ) : null}
                    <div className="pt-2 border-t border-slate-50 flex justify-between text-[10px] font-bold">
                      <span>Total Before Tax</span>
                      <span className="font-mono">{ (totals.revisedSubtotal - totals.discountAmount + totals.additionalChargesTotal).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {project.taxPercent ? (
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">VAT ({project.taxPercent}%) {project.isTaxInclusive ? '(Incl.)' : ''}</span>
                        <span className="font-mono font-bold">{totals.taxAmount.toLocaleString()}</span>
                      </div>
                    ) : null}
                    <div className="pt-2 border-t border-slate-50 flex justify-between text-[11px] font-bold text-blue-600">
                      <span>Final Revised Sum</span>
                      <span className="font-mono">{totals.finalTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Variation Table */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setActiveTab('all')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest transition-all",
                        activeTab === 'all' ? "bg-slate-800 text-white shadow-lg shadow-slate-800/20" : "text-slate-500 hover:bg-slate-100"
                      )}
                    >
                      All Items
                    </button>
                    <button 
                      onClick={() => setActiveTab('original')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest transition-all",
                        activeTab === 'original' ? "bg-slate-800 text-white shadow-lg shadow-slate-800/20" : "text-slate-500 hover:bg-slate-100"
                      )}
                    >
                      Original
                    </button>
                    <button 
                      onClick={() => setActiveTab('additional')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest transition-all",
                        activeTab === 'additional' ? "bg-emerald-600 text-white" : "text-emerald-600 hover:bg-emerald-50"
                      )}
                    >
                      Additional
                    </button>
                    <button 
                      onClick={() => setActiveTab('omitted')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest transition-all",
                        activeTab === 'omitted' ? "bg-rose-600 text-white" : "text-rose-600 hover:bg-rose-50"
                      )}
                    >
                      Omitted
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={onOpenCatalog}
                      className="flex items-center gap-2 px-4 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold tracking-widest hover:bg-slate-200 transition-all"
                    >
                      <FileText size={14} /> Catalog
                    </button>
                    <button 
                      onClick={addAdditionalItem}
                      className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold tracking-widest hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-600/20"
                    >
                      <Plus size={14} /> Add Variation Item
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <BOQTable 
                    items={filteredItems}
                    currency="LKR"
                    onChange={handleItemsChange}
                    onAddItem={addAdditionalItem}
                    onMoveItem={handleMoveItem}
                    onDeleteItem={handleDeleteItem}
                    onDuplicateItem={handleDuplicateItem}
                    onInsertItem={handleInsertItem}
                    onOpenCatalog={onOpenCatalog}
                    isVariationMode={true}
                    onToggleOmit={toggleOmitItem}
                  />
                </div>
              </div>
            </div>

            {/* Sidebar Audit Log */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold tracking-widest text-slate-900">Recent Activity</h3>
                  <button 
                    onClick={() => setMainTab('audit')}
                    className="text-[9px] font-bold text-blue-600 hover:underline tracking-widest"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {auditLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="relative pl-4 border-l-2 border-slate-100 py-1">
                      <div className={cn(
                        "absolute -left-[5px] top-2 w-2 h-2 rounded-full",
                        log.type === 'Variation' ? "bg-blue-500" :
                        log.type === 'Status' ? "bg-amber-500" :
                        log.type === 'Timeline' ? "bg-emerald-500" :
                        "bg-slate-400"
                      )} />
                      <p className="text-[10px] font-bold text-slate-900 leading-tight">{log.action}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5 line-clamp-1">{log.details}</p>
                      <p className="text-[8px] text-slate-400 mt-1 font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  ))}
                  {auditLogs.length === 0 && (
                    <p className="text-[10px] text-slate-400 text-center py-4 italic">No recent activity</p>
                  )}
                </div>
              </div>

              <div className="bg-slate-800 p-5 rounded-2xl shadow-lg shadow-slate-800/20 text-white">
                <h3 className="text-[10px] font-bold tracking-widest text-slate-400 mb-4">Project Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-400 font-bold tracking-widest">Status</span>
                    <span className="text-[10px] font-bold text-emerald-400">{project.status}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-400 font-bold tracking-widest">Client</span>
                    <span className="text-[10px] font-bold truncate max-w-[120px]">{project.client.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-400 font-bold tracking-widest">Start Date</span>
                    <span className="text-[10px] font-bold">{project.startDate}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {mainTab === 'payments' && (
          <motion.div
            key="payments"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold">Tiered Advance Payments</h2>
                  <p className="text-[10px] text-slate-400 font-bold tracking-widest">Define payment milestones based on project phases</p>
                </div>
                <button 
                  onClick={addPaymentTier}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-bold tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                >
                  <Plus size={14} /> Add Payment Tier
                </button>
              </div>

              <div className="space-y-4">
                {paymentTiers.map((tier) => (
                  <div key={tier.id} className="flex flex-wrap items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-[8px] font-bold text-slate-400 tracking-widest mb-1">Phase / Milestone</label>
                      <input 
                        type="text"
                        value={tier.phase ?? ''}
                        onChange={(e) => updatePaymentTier(tier.id, 'phase', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-slate-900 transition-all"
                        placeholder="e.g. Mobilization, 50% Completion"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-[8px] font-bold text-slate-400 tracking-widest mb-1">Percentage (%)</label>
                      <input 
                        type="number"
                        value={tier.percentage ?? 0}
                        onChange={(e) => updatePaymentTier(tier.id, 'percentage', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-slate-900 transition-all"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div className="w-40">
                      <label className="block text-[8px] font-bold text-slate-400 tracking-widest mb-1">Amount (LKR)</label>
                      <div className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-600">
                        {tier.amount.toLocaleString()}
                      </div>
                    </div>
                    <div className="w-32">
                      <label className="block text-[8px] font-bold text-slate-400 tracking-widest mb-1">Due Date</label>
                      <input 
                        type="date"
                        value={tier.dueDate ?? ''}
                        onChange={(e) => updatePaymentTier(tier.id, 'dueDate', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-bold focus:ring-2 focus:ring-slate-900 transition-all"
                      />
                    </div>
                    <div className="w-32">
                      <label className="block text-[8px] font-bold text-slate-400 tracking-widest mb-1">Invoice No</label>
                      <input 
                        type="text"
                        value={tier.invoiceNo ?? ''}
                        onChange={(e) => updatePaymentTier(tier.id, 'invoiceNo', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-bold focus:ring-2 focus:ring-slate-900 transition-all"
                        placeholder="INV-001"
                      />
                    </div>
                    <div className="w-32">
                      <label className="block text-[8px] font-bold text-slate-400 tracking-widest mb-1">Status</label>
                      <select 
                        value={tier.status ?? 'Pending'}
                        onChange={(e) => updatePaymentTier(tier.id, 'status', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-bold focus:ring-2 focus:ring-slate-900 transition-all"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </div>
                    <button 
                      onClick={() => removePaymentTier(tier.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors mt-4"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {paymentTiers.length === 0 && (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <CreditCard size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-500 font-bold text-xs">No payment tiers defined</p>
                    <p className="text-slate-400 text-[9px] font-bold tracking-widest mt-1">Add tiers to track project advance payments</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center">
                <div className="text-[10px] font-bold tracking-widest text-slate-400">
                  Total Percentage: <span className={cn(
                    paymentTiers.reduce((sum, t) => sum + t.percentage, 0) > 100 ? "text-rose-600" : "text-emerald-600"
                  )}>
                    {paymentTiers.reduce((sum, t) => sum + t.percentage, 0)}%
                  </span>
                </div>
                <div className="text-[10px] font-bold tracking-widest text-slate-400">
                  Total Amount: <span className="text-slate-900">
                    LKR {paymentTiers.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {mainTab === 'audit' && (
          <motion.div
            key="audit"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-lg font-bold">Project Activity Audit Log</h2>
                  <p className="text-[10px] text-slate-400 font-bold tracking-widest">Comprehensive history of all changes and variations</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-full tracking-widest border border-emerald-100">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Real-time Tracking Active
                  </div>
                  <button className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-md text-[9px] font-bold tracking-widest hover:bg-slate-200 transition-all">
                    Export Log
                  </button>
                </div>
              </div>

              <div className="relative">
                {auditLogs.length > 0 && (
                  <div className="absolute left-[19px] top-0 bottom-0 w-px bg-slate-100" />
                )}
                <div className="space-y-8">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="relative pl-12">
                      <div className={cn(
                        "absolute left-0 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10",
                        log.type === 'Variation' ? "bg-blue-100 text-blue-600" :
                        log.type === 'Status' ? "bg-amber-100 text-amber-600" :
                        log.type === 'Timeline' ? "bg-emerald-100 text-emerald-600" :
                        "bg-slate-100 text-slate-600"
                      )}>
                        {log.type === 'Variation' ? <PlusCircle size={18} /> :
                         log.type === 'Status' ? <AlertCircle size={18} /> :
                         log.type === 'Timeline' ? <Calendar size={18} /> :
                         <History size={18} />}
                      </div>
                      <div className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-slate-200 transition-all shadow-sm group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-bold tracking-widest text-slate-400 font-mono">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full tracking-widest border border-slate-100">
                            <User size={10} />
                            {log.user}
                          </div>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 mb-1.5 group-hover:text-slate-900 transition-colors">{log.action}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">{log.details}</p>
                        
                        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-bold tracking-widest",
                            log.type === 'Variation' ? "bg-blue-50 text-blue-600" :
                            log.type === 'Status' ? "bg-amber-50 text-amber-600" :
                            log.type === 'Timeline' ? "bg-emerald-50 text-emerald-600" :
                            "bg-slate-50 text-slate-500"
                          )}>
                            {log.type}
                          </span>
                          {log.type === 'Variation' && (
                            <div className="flex items-center gap-1.5 text-[8px] font-bold text-amber-600 tracking-widest bg-amber-50 px-2 py-0.5 rounded">
                              <AlertCircle size={10} />
                              Financial Impact
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {auditLogs.length === 0 && (
                    <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                      <History size={48} className="mx-auto text-slate-200 mb-4" />
                      <h3 className="text-slate-500 font-bold text-sm">No activity logs yet</h3>
                      <p className="text-slate-400 text-[10px] font-bold tracking-widest mt-2 max-w-[200px] mx-auto leading-relaxed">
                        Activities will be logged automatically as you make changes to the project
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {mainTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
              <ProjectHistory 
                project={project}
                quotes={quotes}
                invoices={invoices}
                payments={payments}
                adjustments={adjustments}
                onViewItem={onViewItem || (() => {})}
              />
            </div>
          </motion.div>
        )}
        {mainTab === 'documents' && (
          <motion.div
            key="documents"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Project Files & Documents</h3>
                  <p className="text-[10px] text-slate-400 font-bold tracking-widest">Access all project-related invoices, reports, and records</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* System Reports */}
                <div 
                  className="group flex items-center justify-between p-4 rounded-2xl border border-blue-100 bg-blue-50/20 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                  onClick={() => onGenerateVariationReport(project)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white border border-blue-100 shadow-sm group-hover:scale-110 transition-transform">
                      <Scale size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-900">Variation Order Report</p>
                      <p className="text-[8px] text-slate-400 font-bold tracking-widest mt-0.5">
                        Current Variations & Impact
                      </p>
                    </div>
                  </div>
                  <Download size={12} className="text-blue-400 group-hover:text-blue-600 transition-colors" />
                </div>

                <div 
                  className="group flex items-center justify-between p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 hover:border-emerald-300 hover:bg-emerald-50 transition-all cursor-pointer"
                  onClick={() => onViewItem?.('Report', project.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white border border-emerald-100 shadow-sm group-hover:scale-110 transition-transform">
                      <TrendingUp size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-900">Project Status Report</p>
                      <p className="text-[8px] text-slate-400 font-bold tracking-widest mt-0.5">
                        Progress & Financial Summary
                      </p>
                    </div>
                  </div>
                  <Download size={12} className="text-emerald-400 group-hover:text-emerald-600 transition-colors" />
                </div>

                <div 
                  className="group flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:border-slate-400 hover:bg-slate-100 transition-all cursor-pointer"
                  onClick={() => onViewItem?.('Accounting Report', project.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-sm group-hover:scale-110 transition-transform">
                      <Briefcase size={16} className="text-slate-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-900">All Project Documents</p>
                      <p className="text-[8px] text-slate-400 font-bold tracking-widest mt-0.5">
                        Merged PDF Bundle
                      </p>
                    </div>
                  </div>
                  <Download size={12} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                </div>

                {projectFiles.map((file) => (
                  <div 
                    key={file.id}
                    className="group flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer"
                    onClick={file.action}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                        {file.icon}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-900 line-clamp-1">{file.name}</p>
                        <p className="text-[8px] text-slate-400 font-bold tracking-widest mt-0.5">
                          {new Date(file.date).toLocaleDateString()} • {file.type}
                        </p>
                      </div>
                    </div>
                    <ExternalLink size={12} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                ))}
                {projectFiles.length === 0 && (
                  <div className="col-span-full py-12 text-center">
                    <FileText size={32} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-[10px] text-slate-400 font-bold tracking-widest">No documents found for this project</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Project Timeline & Schedule</h3>
                  <p className="text-[10px] text-slate-400 font-bold tracking-widest">Manage project milestones and job schedules</p>
                </div>
              </div>
              <TimelineEditor 
                quote={{
                  ...project,
                  quoteNo: project.originalQuoteNo || 'VO',
                  items: items,
                  timeline: timeline || { id: crypto.randomUUID(), quoteId: project.id, jobs: [] },
                  additionalCharges: project.additionalCharges || [],
                  discountPercent: project.discountPercent || 0,
                  taxPercent: project.taxPercent || 0,
                  isTaxInclusive: project.isTaxInclusive || false,
                  advancePercent: 0,
                  estimatedDeliveryDays: 0,
                  currency: project.currency || 'LKR',
                  status: QuoteStatus.PROJECT,
                  quoteType: 'Variation',
                  pricingMethod: 'Unit Rate',
                  projectStage: 'Variation',
                  scopeCoverage: 'Supply & Install',
                  version: 1,
                  submittedDate: new Date().toISOString(),
                  validityDays: 15,
                  terms: terms
                } as Quote}
                onChange={setTimeline}
                settings={settings}
              />
            </div>

            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Terms & Conditions</h3>
                  <p className="text-[10px] text-slate-400 font-bold tracking-widest">Update project specific terms and legal clauses</p>
                </div>
              </div>
              <TermsEditor 
                terms={terms}
                onChange={setTerms}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {showDeleteProjectConfirm && (
        <ConfirmationModal
          isOpen={showDeleteProjectConfirm}
          title="Delete Project"
          message={`Are you sure you want to delete project "${project.projectName}"? This will permanently remove all associated data, variations, and audit logs. This action cannot be undone.`}
          confirmText="Delete Project"
          cancelText="Cancel"
          onConfirm={() => {
            onDeleteProject(project.id);
          }}
          onClose={() => setShowDeleteProjectConfirm(false)}
          type="danger"
        />
      )}
    </div>
  );
};
