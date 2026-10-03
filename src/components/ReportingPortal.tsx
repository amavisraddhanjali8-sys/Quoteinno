import React, { useState, useMemo } from 'react';
import { 
  FileText, TrendingUp, Clock, ShieldCheck, 
  AlertCircle, Download, Search,
  Printer, Mail, DollarSign,
  BarChart3, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuoteData } from '../hooks/useQuoteData';
import { CustomerFinancials } from '../types';
import { cn } from '../lib/utils';
import { ExportActions } from './common/ExportActions';
import { downloadCSV, downloadPDFTable } from '../services/dataExportService';
import { 
  generateAccountingReportPDF, 
  generateAllCustomerReportsPDF,
  generateVariationReport,
  generateProjectReportPDF,
  generateTimelineReport,
  generateAllProjectDocumentsPDF
} from '../pdfGenerator';

type ReportType = 'Statement' | 'Aging' | 'Collection' | 'Retention' | 'Project' | 'BadDebt';

interface ReportingPortalProps {
  initialReport?: ReportType;
}

export const ReportingPortal: React.FC<ReportingPortalProps> = ({
  initialReport = 'Statement'
}) => {
  const { 
    clients, invoices, payments, adjustments, 
    customerFinancials, projectFinancials, projects,
    companySettings, quotes, auditLogs
  } = useQuoteData();
  
  const [activeReport, setActiveReport] = useState<ReportType>(initialReport);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  React.useEffect(() => {
    if (initialReport) {
      setActiveReport(initialReport);
    }
  }, [initialReport]);

  React.useEffect(() => {
    if (!selectedClientId && clients.length > 0) {
      setSelectedClientId(clients[0].id);
    }
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [clients, projects, selectedClientId, selectedProjectId]);

  const selectedClient = useMemo(() => 
    clients.find(c => c.id === selectedClientId), [clients, selectedClientId]
  );

  const filteredClients = useMemo(() => 
    clients.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.tradeName?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [clients, searchTerm]
  );

  const reportData = useMemo(() => {
    if (activeReport === 'Statement' && selectedClientId) {
      const clientInvoices = invoices.filter(i => i.client.id === selectedClientId);
      const clientPayments = payments.filter(p => p.clientId === selectedClientId);
      const clientAdjustments = adjustments.filter(a => a.clientId === selectedClientId);
      
      let transactions = [
        ...clientInvoices.map(i => ({ date: i.date, desc: `Invoice #${i.invoiceNo}`, amount: i.grandTotal, type: 'Debit' })),
        ...clientPayments.map(p => ({ date: p.date, desc: `Payment #${p.paymentNo}`, amount: p.amount, type: 'Credit' })),
        ...clientAdjustments.map(a => ({ date: a.date, desc: `${a.type} Adjustment`, amount: a.amount, type: a.amount > 0 ? 'Credit' : 'Debit' }))
      ];

      if (dateRange.start) {
        transactions = transactions.filter(t => new Date(t.date) >= new Date(dateRange.start));
      }
      if (dateRange.end) {
        transactions = transactions.filter(t => new Date(t.date) <= new Date(dateRange.end));
      }

      transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let balance = 0;
      return transactions.map(t => {
        balance += (t.type === 'Debit' ? t.amount : -t.amount);
        return { ...t, balance };
      });
    }
    return [];
  }, [activeReport, selectedClientId, invoices, payments, adjustments, dateRange]);

  const renderReportContent = () => {
    switch (activeReport) {
      case 'Statement':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-end bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-0.5 tracking-tight">Customer Statement</h3>
                <p className="text-[10px] text-slate-500 font-bold tracking-tight">{selectedClient?.name || 'Select a client to view statement'}</p>
              </div>
              {selectedClientId && (
                <div className="flex gap-1.5">
                  <button className="p-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                    <Printer size={14} />
                  </button>
                  <button className="p-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                    <Mail size={14} />
                  </button>
                  <button 
                    onClick={() => {
                      if (!selectedClient) return;
                      generateAllCustomerReportsPDF(
                        selectedClient.name,
                        invoices,
                        projects,
                        payments,
                        adjustments,
                        companySettings
                      );
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                  >
                    <Download size={14} /> Download All
                  </button>
                </div>
              )}
            </div>

            {selectedClientId ? (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="py-2.5 px-4 text-left text-[9px] font-black text-slate-400 tracking-[0.15em] uppercase">Date</th>
                      <th className="py-2.5 px-4 text-left text-[9px] font-black text-slate-400 tracking-[0.15em] uppercase">Description</th>
                      <th className="py-2.5 px-4 text-right text-[9px] font-black text-slate-400 tracking-[0.15em] uppercase">Debit</th>
                      <th className="py-2.5 px-4 text-right text-[9px] font-black text-slate-400 tracking-[0.15em] uppercase">Credit</th>
                      <th className="py-2.5 px-4 text-right text-[9px] font-black text-slate-400 tracking-[0.15em] uppercase">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {reportData.map((row: any, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-4 text-[10px] font-bold text-slate-500 font-mono">{row.date}</td>
                        <td className="py-2.5 px-4 text-[11px] font-black text-slate-900">{row.desc}</td>
                        <td className="py-2.5 px-4 text-right text-[11px] font-black text-red-600 font-mono">
                          {row.type === 'Debit' ? row.amount.toLocaleString() : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right text-[11px] font-black text-emerald-600 font-mono">
                          {row.type === 'Credit' ? row.amount.toLocaleString() : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right text-[11px] font-black text-slate-900 font-mono">
                          {row.balance.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Search size={32} className="text-slate-300 mb-3" />
                <p className="text-slate-500 font-black text-[11px] uppercase tracking-widest">Search and select a client to generate statement</p>
              </div>
            )}
          </div>
        );

      case 'Aging':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">AR Aging Intelligence</h3>
                <button 
                  onClick={() => {
                    const data = customerFinancials.filter(f => f.outstandingBalance > 0).map(f => [
                      clients.find(c => c.id === f.clientId)?.name || '',
                      f.aging.current.toLocaleString(),
                      f.aging['1-30'].toLocaleString(),
                      f.aging['31-60'].toLocaleString(),
                      f.aging['61-90'].toLocaleString(),
                      f.aging['90+'].toLocaleString(),
                      f.outstandingBalance.toLocaleString()
                    ]);
                    generateAccountingReportPDF('Aging Report', data, ['Customer', 'Current', '1-30', '31-60', '61-90', '90+', 'Total'], companySettings);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                >
                  <Download size={14} /> Export Aging
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'].map((label, idx) => {
                const key = (label === 'Current' ? 'current' : label.split(' ')[0]) as keyof CustomerFinancials['aging'];
                const total = customerFinancials.reduce((sum, f) => sum + (f.aging[key] || 0), 0);
                return (
                  <div key={label} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 tracking-[0.1em] uppercase mb-1">{label}</p>
                    <p className={cn(
                      "text-sm font-black tracking-tight",
                      idx === 0 ? "text-slate-900" : idx < 3 ? "text-amber-600" : "text-red-600"
                    )}>
                      Rs. {total.toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="py-2.5 px-4 text-left text-[9px] font-black text-slate-400 tracking-[0.1em] uppercase">Customer</th>
                    <th className="py-2.5 px-4 text-right text-[9px] font-black text-slate-400 tracking-[0.1em] uppercase">Current</th>
                    <th className="py-2.5 px-4 text-right text-[9px] font-black text-slate-400 tracking-[0.1em] uppercase">1-30</th>
                    <th className="py-2.5 px-4 text-right text-[9px] font-black text-slate-400 tracking-[0.1em] uppercase">31-60</th>
                    <th className="py-2.5 px-4 text-right text-[9px] font-black text-slate-400 tracking-[0.1em] uppercase">61-90</th>
                    <th className="py-2.5 px-4 text-right text-[9px] font-black text-slate-400 tracking-[0.1em] uppercase">90+</th>
                    <th className="py-2.5 px-4 text-right text-[9px] font-black text-slate-400 tracking-[0.1em] uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {customerFinancials.filter(f => f.outstandingBalance > 0).map((f) => (
                    <tr key={f.clientId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-4">
                        <p className="text-[11px] font-black text-slate-900">{clients.find(c => c.id === f.clientId)?.name}</p>
                      </td>
                      <td className="py-2.5 px-4 text-right text-[10px] font-bold text-slate-500 font-mono">{f.aging.current.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right text-[10px] font-bold text-amber-600 font-mono">{f.aging['1-30'].toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right text-[10px] font-bold text-amber-700 font-mono">{f.aging['31-60'].toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right text-[10px] font-bold text-red-600 font-mono">{f.aging['61-90'].toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right text-[10px] font-black text-red-700 font-mono">{f.aging['90+'].toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right text-[11px] font-black text-slate-900 font-mono">{f.outstandingBalance.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'Retention':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Retention Summary</h3>
                <button 
                  onClick={() => {
                    const data = projectFinancials.filter(f => f.totalRetention > 0).map(f => [
                      f.projectName,
                      f.totalRetention.toLocaleString(),
                      f.totalRetentionReleased.toLocaleString(),
                      (f.totalRetention - f.totalRetentionReleased).toLocaleString()
                    ]);
                    generateAccountingReportPDF('Retention Summary', data, ['Project', 'Held Amount', 'Released', 'Balance'], companySettings);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                >
                  <Download size={18} /> Export Retention
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-2">Total Retention Held</p>
                <p className="text-3xl font-bold text-slate-900">
                  Rs. {projectFinancials.reduce((sum, f) => sum + f.totalRetention, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-2">Total Released</p>
                <p className="text-3xl font-bold text-emerald-600">
                  Rs. {projectFinancials.reduce((sum, f) => sum + f.totalRetentionReleased, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-2">Pending Release</p>
                <p className="text-3xl font-bold text-blue-600">
                  Rs. {(projectFinancials.reduce((sum, f) => sum + f.totalRetention, 0) - projectFinancials.reduce((sum, f) => sum + f.totalRetentionReleased, 0)).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="py-4 px-6 text-left text-[10px] font-bold text-slate-400 tracking-widest">Project Name</th>
                    <th className="py-4 px-6 text-right text-[10px] font-bold text-slate-400 tracking-widest">Held Amount</th>
                    <th className="py-4 px-6 text-right text-[10px] font-bold text-slate-400 tracking-widest">Released</th>
                    <th className="py-4 px-6 text-right text-[10px] font-bold text-slate-400 tracking-widest">Balance</th>
                    <th className="py-4 px-6 text-center text-[10px] font-bold text-slate-400 tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {projectFinancials.filter(f => f.totalRetention > 0).map((f) => (
                    <tr key={f.projectId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <p className="text-sm font-bold text-slate-900">{f.projectName}</p>
                      </td>
                      <td className="py-4 px-6 text-right text-sm font-bold text-slate-700">{f.totalRetention.toLocaleString()}</td>
                      <td className="py-4 px-6 text-right text-sm font-bold text-emerald-600">{f.totalRetentionReleased.toLocaleString()}</td>
                      <td className="py-4 px-6 text-right text-sm font-bold text-blue-600">{(f.totalRetention - f.totalRetentionReleased).toLocaleString()}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold tracking-widest",
                          f.totalRetention === f.totalRetentionReleased ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {f.totalRetention === f.totalRetentionReleased ? 'Fully Released' : 'Held'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'Collection':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Collection Summary</h3>
                <button 
                  onClick={() => {
                    const data = payments.map(p => [
                      p.date,
                      p.clientName,
                      p.method,
                      p.reference || '-',
                      p.amount.toLocaleString()
                    ]);
                    generateAccountingReportPDF('Collection Report', data, ['Date', 'Customer', 'Method', 'Reference', 'Amount'], companySettings);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                >
                  <Download size={18} /> Export Collections
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-1">Total Invoiced</p>
                <p className="text-xl font-bold text-slate-900">
                  Rs. {invoices.reduce((sum, i) => sum + i.grandTotal, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-1">Total Collected</p>
                <p className="text-xl font-bold text-emerald-600">
                  Rs. {payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-1">Collection Rate</p>
                <p className="text-xl font-bold text-blue-600">
                  {invoices.reduce((sum, i) => sum + i.grandTotal, 0) > 0 
                    ? ((payments.reduce((sum, p) => sum + p.amount, 0) / invoices.reduce((sum, i) => sum + i.grandTotal, 0)) * 100).toFixed(1)
                    : '0'}%
                </p>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-1">Outstanding</p>
                <p className="text-xl font-bold text-red-600">
                  Rs. {(invoices.reduce((sum, i) => sum + i.grandTotal, 0) - payments.reduce((sum, p) => sum + p.amount, 0) - adjustments.reduce((sum, a) => sum + a.amount, 0)).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Recent Collections</h3>
                <button className="text-[10px] font-bold text-blue-600 tracking-widest hover:underline">View All</button>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="py-4 px-6 text-left text-[10px] font-bold text-slate-400 tracking-widest">Date</th>
                    <th className="py-4 px-6 text-left text-[10px] font-black text-slate-400 tracking-widest">Customer</th>
                    <th className="py-4 px-6 text-left text-[10px] font-bold text-slate-400 tracking-widest">Method</th>
                    <th className="py-4 px-6 text-left text-[10px] font-bold text-slate-400 tracking-widest">Reference</th>
                    <th className="py-4 px-6 text-right text-[10px] font-bold text-slate-400 tracking-widest">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 text-sm font-medium text-slate-600">{p.date}</td>
                      <td className="py-4 px-6 text-sm font-bold text-slate-900">{p.clientName}</td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold tracking-widest">
                          {p.method}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-slate-500">{p.reference || '-'}</td>
                      <td className="py-4 px-6 text-right text-sm font-bold text-emerald-600">
                        Rs. {p.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'Project':
        const selectedProject = projects.find(p => p.id === selectedProjectId);
        return (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tighter">Project Financial Overview</h3>
                <p className="text-sm text-slate-500 font-medium">Detailed financial status of all active and completed projects</p>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-1">Total Contract Value</p>
                  <p className="text-2xl font-bold text-slate-900">
                    Rs. {projectFinancials.reduce((sum, f) => sum + f.contractValue, 0).toLocaleString()}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    const data = projectFinancials.map(f => [
                      f.projectName,
                      projects.find(p => p.id === f.projectId)?.client.name || '',
                      f.contractValue.toLocaleString(),
                      f.variationsValue.toLocaleString(),
                      f.totalInvoiced.toLocaleString(),
                      f.totalPaid.toLocaleString(),
                      (f.totalValue - f.totalPaid).toLocaleString()
                    ]);
                    generateAccountingReportPDF('Project Financials', data, ['Project', 'Customer', 'Contract Sum', 'Variations', 'Invoiced', 'Collected', 'Balance'], companySettings);
                  }}
                  className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                  title="Export All Projects Financials"
                >
                  <Download size={20} />
                </button>
              </div>
            </div>

            {/* Project Selector for Specific Reports */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-[10px] font-bold text-slate-400 tracking-widest">Specific Project Reports</h4>
                <select 
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a project...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.projectName}</option>
                  ))}
                </select>
              </div>

              {selectedProject ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button 
                    onClick={() => generateProjectReportPDF(selectedProject, companySettings)}
                    className="flex flex-col items-center justify-center p-6 rounded-2xl border border-emerald-100 bg-emerald-50/20 hover:border-emerald-300 hover:bg-emerald-50 transition-all group"
                  >
                    <div className="p-3 rounded-xl bg-white border border-emerald-100 shadow-sm group-hover:scale-110 transition-transform mb-3">
                      <FileText size={24} className="text-emerald-600" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 tracking-tight">Status Report</p>
                    <p className="text-[8px] text-slate-400 font-bold tracking-widest mt-1">Progress & Financials</p>
                  </button>

                  <button 
                    onClick={() => generateVariationReport(selectedProject, companySettings)}
                    className="flex flex-col items-center justify-center p-6 rounded-2xl border border-blue-100 bg-blue-50/20 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                  >
                    <div className="p-3 rounded-xl bg-white border border-blue-100 shadow-sm group-hover:scale-110 transition-transform mb-3">
                      <TrendingUp size={24} className="text-blue-600" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 tracking-tight">Variation Report</p>
                    <p className="text-[8px] text-slate-400 font-bold tracking-widest mt-1">Changes & Impact</p>
                  </button>

                  <button 
                    onClick={() => generateTimelineReport(selectedProject, companySettings)}
                    className="flex flex-col items-center justify-center p-6 rounded-2xl border border-amber-100 bg-amber-50/20 hover:border-amber-300 hover:bg-amber-50 transition-all group"
                  >
                    <div className="p-3 rounded-xl bg-white border border-amber-100 shadow-sm group-hover:scale-110 transition-transform mb-3">
                      <Clock size={24} className="text-amber-600" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 tracking-tight">Timeline Report</p>
                    <p className="text-[8px] text-slate-400 font-bold tracking-widest mt-1">Schedule & Milestones</p>
                  </button>

                  <button 
                    onClick={() => {
                      const projectQuote = quotes.find(q => q.quoteNo === selectedProject.originalQuoteNo);
                      const projectInvoices = invoices.filter(inv => inv.projectId === selectedProject.id);
                      const projectLogs = auditLogs.filter(log => log.projectName === selectedProject.projectName);
                      generateAllProjectDocumentsPDF(selectedProject, projectQuote, projectInvoices, projectLogs, companySettings);
                    }}
                    className="flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-200 bg-slate-50 hover:border-slate-400 hover:bg-slate-100 transition-all group"
                  >
                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm group-hover:scale-110 transition-transform mb-3">
                      <Download size={24} className="text-slate-600" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 tracking-tight">All Documents</p>
                    <p className="text-[8px] text-slate-400 font-bold tracking-widest mt-1">Merged PDF Bundle</p>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                  <AlertCircle size={32} className="text-slate-200 mb-2" />
                  <p className="text-sm font-bold text-slate-400">Select a project to generate specific reports</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="py-4 px-6 text-left text-[10px] font-bold text-slate-400 tracking-widest">Project</th>
                    <th className="py-4 px-6 text-right text-[10px] font-bold text-slate-400 tracking-widest">Contract Sum</th>
                    <th className="py-4 px-6 text-right text-[10px] font-bold text-slate-400 tracking-widest">Variations</th>
                    <th className="py-4 px-6 text-right text-[10px] font-bold text-slate-400 tracking-widest">Invoiced</th>
                    <th className="py-4 px-6 text-right text-[10px] font-bold text-slate-400 tracking-widest">Collected</th>
                    <th className="py-4 px-6 text-right text-[10px] font-bold text-slate-400 tracking-widest">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {projectFinancials.map((f) => (
                    <tr key={f.projectId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <p className="text-sm font-bold text-slate-900">{f.projectName}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{projects.find(p => p.id === f.projectId)?.client.name}</p>
                      </td>
                      <td className="py-4 px-6 text-right text-sm font-bold text-slate-700">{f.contractValue.toLocaleString()}</td>
                      <td className="py-4 px-6 text-right text-sm font-bold text-blue-600">{f.variationsValue.toLocaleString()}</td>
                      <td className="py-4 px-6 text-right text-sm font-bold text-slate-900">{f.totalInvoiced.toLocaleString()}</td>
                      <td className="py-4 px-6 text-right text-sm font-bold text-emerald-600">{f.totalPaid.toLocaleString()}</td>
                      <td className="py-4 px-6 text-right text-sm font-bold text-slate-900">
                        {(f.totalValue - f.totalPaid).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'BadDebt':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Bad Debt Analysis</h3>
                <button 
                  onClick={() => {
                    const data = customerFinancials.filter(f => (f.totalBadDebt || 0) > 0).map(f => [
                      clients.find(c => c.id === f.clientId)?.name || '',
                      `${((f.totalBadDebt || 0) / f.totalInvoiced * 100).toFixed(1)}%`,
                      f.outstandingBalance.toLocaleString(),
                      (f.totalBadDebt || 0).toLocaleString()
                    ]);
                    generateAccountingReportPDF('Bad Debt Analysis', data, ['Customer', 'Risk Factor', 'Overdue Amount', 'Bad Debt Est.'], companySettings);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                >
                  <Download size={18} /> Export Analysis
                </button>
            </div>
            <div className="bg-red-50 border border-red-100 p-8 rounded-[2.5rem] flex items-center gap-6">
              <div className="p-4 bg-red-100 text-red-600 rounded-2xl">
                <AlertCircle size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-900">Bad Debt Analysis</h3>
                <p className="text-sm text-red-700 font-medium">Total estimated bad debt based on cancelled invoices and overdue payments {'>'} 90 days.</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-[10px] font-bold text-red-400 tracking-widest mb-1">Total Risk Amount</p>
                <p className="text-3xl font-bold text-red-600">
                  Rs. {customerFinancials.reduce((sum, f) => sum + (f.totalBadDebt || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="py-4 px-6 text-left text-[10px] font-black text-slate-400 tracking-widest">Customer</th>
                    <th className="py-4 px-6 text-left text-[10px] font-bold text-slate-400 tracking-widest">Risk Factor</th>
                    <th className="py-4 px-6 text-right text-[10px] font-bold text-slate-400 tracking-widest">Overdue Amount</th>
                    <th className="py-4 px-6 text-right text-[10px] font-bold text-slate-400 tracking-widest">Bad Debt Est.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {customerFinancials.filter(f => (f.totalBadDebt || 0) > 0).map((f) => (
                    <tr key={f.clientId} className="hover:bg-red-50/30 transition-colors">
                      <td className="py-4 px-6">
                        <p className="text-sm font-bold text-slate-900">{clients.find(c => c.id === f.clientId)?.name}</p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-red-500" 
                              style={{ width: `${Math.min(100, ((f.totalBadDebt || 0) / f.totalInvoiced) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-black text-red-600">
                            {((f.totalBadDebt || 0) / f.totalInvoiced * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right text-sm font-bold text-slate-600">{f.outstandingBalance.toLocaleString()}</td>
                      <td className="py-4 px-6 text-right text-sm font-black text-red-600">{(f.totalBadDebt || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
            <TrendingUp size={48} className="text-slate-300 mb-4" />
            <p className="text-slate-500 font-bold">Select a report type from the sidebar</p>
          </div>
        );
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      {/* Sidebar - Simple White Box Architecture */}
      <div className="w-[200px] bg-white border-r border-slate-200/80 flex flex-col sticky top-0 h-screen shadow-xs z-20">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shadow-xs">
              <BarChart3 size={15} className="text-white" />
            </div>
            <h1 className="text-xs font-bold text-slate-900 tracking-wider">Reports & Audits</h1>
          </div>
          <p className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase">Financial Analytics</p>
        </div>
        
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {[
            { id: 'Statement', label: 'Statement', icon: FileText },
            { id: 'Aging', label: 'Aging AR', icon: Clock },
            { id: 'Collection', label: 'Collections', icon: TrendingUp },
            { id: 'Retention', label: 'Retention', icon: ShieldCheck },
            { id: 'Project', label: 'Project Fin.', icon: DollarSign },
            { id: 'BadDebt', label: 'Risk Lab', icon: AlertCircle },
          ].map((report) => (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id as ReportType)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all relative group text-xs font-medium",
                activeReport === report.id 
                  ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200/60 shadow-2xs" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <report.icon size={15} className={cn(
                "transition-transform group-hover:scale-105",
                activeReport === report.id ? "text-blue-600" : "text-slate-400"
              )} />
              <span className="text-xs tracking-tight">{report.label}</span>
              {activeReport === report.id && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
              )}
            </button>
          ))}
        </div>

        <div className="p-3 mt-auto border-t border-slate-100">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
            <div className="flex items-center gap-1.5 mb-1">
              <ShieldCheck size={13} className="text-emerald-600" />
              <p className="text-[10px] font-bold text-slate-800">Audited Financials</p>
            </div>
            <p className="text-[9px] text-slate-500 font-medium leading-tight">
              Reconciled ledger active
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header - One Line Ribbon with Simple Description & Only Buttons */}
        <header className="px-5 py-2.5 bg-white border-b border-slate-200/80 flex items-center justify-between gap-4 sticky top-0 z-10 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <BarChart3 size={16} />
            </div>
            <div className="flex items-baseline gap-2 min-w-0">
              <h1 className="text-sm font-bold text-slate-900 whitespace-nowrap">
                Financial Reports & Audits
              </h1>
              <span className="text-xs text-slate-500 font-normal truncate hidden sm:inline">
                • {activeReport} analysis, aging AR & ledger reconciliation
              </span>
            </div>
          </div>

          {/* Action Buttons ONLY */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
              <span className="text-[10px] font-medium text-slate-400">Date:</span>
              <input 
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="bg-transparent text-[11px] font-semibold text-slate-700 outline-none"
              />
              <span className="text-slate-300">-</span>
              <input 
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="bg-transparent text-[11px] font-semibold text-slate-700 outline-none"
              />
            </div>

            <ExportActions 
              onExportCSV={() => {
                const headers = ['Client', 'Category', 'Phone', 'Address', 'Active Report'];
                const rows = filteredClients.map(c => [
                  `"${c.name.replace(/"/g, '""')}"`,
                  `"${c.category || ''}"`,
                  `"${c.phone || ''}"`,
                  `"${(c.address || '').replace(/"/g, '""')}"`,
                  `"${activeReport}"`
                ]);
                downloadCSV(`${activeReport.toLowerCase()}-report-${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
              }}
              onExportPDF={() => {
                const headers = ['Client Name', 'Category', 'Phone', 'Report Stage'];
                const rows = filteredClients.map(c => [
                  c.name,
                  c.category || 'General',
                  c.phone || 'N/A',
                  activeReport
                ]);
                downloadPDFTable(
                  `${activeReport} Financial Audit Report`,
                  headers,
                  rows,
                  `${activeReport.toLowerCase()}-report-${new Date().toISOString().split('T')[0]}.pdf`,
                  `Date Range: ${dateRange.start} to ${dateRange.end} | Filtered Records: ${filteredClients.length}`
                );
              }}
              labelCSV="CSV"
              labelPDF="PDF"
            />
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Client Sub-sidebar */}
          <div className="w-[220px] bg-white border-r border-slate-100 flex flex-col shadow-sm">
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter clients..."
                  className="w-full bg-slate-50 border-none rounded-lg pl-8 pr-3 py-1.5 text-[10px] font-bold text-slate-700 focus:ring-1 focus:ring-blue-600 shadow-inner"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {filteredClients.map(client => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left group border",
                    selectedClientId === client.id
                      ? "bg-blue-50 border-blue-200 shadow-sm"
                      : "bg-white border-transparent hover:bg-slate-50"
                  )}
                >
                  <div className="min-w-0 pr-2">
                    <p className={cn(
                      "text-[11px] font-black tracking-tight truncate",
                      selectedClientId === client.id ? "text-blue-900" : "text-slate-900"
                    )}>{client.name}</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase truncate">{client.tradeName || 'Standard'}</p>
                  </div>
                  {selectedClientId === client.id && <ChevronRight size={10} className="text-blue-500 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Report Viewer */}
          <main className="flex-1 p-4 overflow-y-auto bg-slate-50/30">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeReport + selectedClientId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="w-full"
              >
                {renderReportContent()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};
