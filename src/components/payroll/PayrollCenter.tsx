import React, { useState } from 'react';
import { 
  Building2, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Landmark,
  Scale,
  FolderTree,
  ChevronRight,
  ArrowRight,
  Plus,
  LayoutDashboard,
  Printer,
  Fingerprint,
  Edit2,
  Trash2,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { payrollService } from '../../services/payrollService';
import { PayrollPeriodRecord, EmployeePayrollItem } from '../../types/payroll';
import { useSecurity } from '../../context/SecurityContext';
import { ProjectPayrollPortal } from './ProjectPayrollPortal';
import { DepartmentPayrollPortal } from './DepartmentPayrollPortal';
import { StatutoryReconciliationPortal } from './StatutoryReconciliationPortal';
import { QuickPayoutsPortal } from './QuickPayoutsPortal';
import { AdvancedCompensationPaysheetHub } from '../workforce/AdvancedCompensationPaysheetHub';
import {
  generateBarcodeDataUrl,
  generateQRCodeDataUrl,
  getCompanyLogoDataUrl,
  drawCompanyLogoAtActualWidth
} from '../../pdfGenerator';

export type PayrollPortalTab = 
  | 'landing'
  | 'advanced-paysheet'
  | 'project-payroll' 
  | 'dept-payroll' 
  | 'statutory' 
  | 'quick-payouts' 
  | 'monthly-register';

export const PayrollCenter: React.FC = () => {
  const { currentUser, hasPermission } = useSecurity();
  const [periods, setPeriods] = useState<PayrollPeriodRecord[]>(() => payrollService.getPayrollPeriods());
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(periods[0]?.id || 'pay-2026-09');
  const [selectedEmployeeSlip, setSelectedEmployeeSlip] = useState<EmployeePayrollItem | null>(null);
  const [activeTab, setActiveTab] = useState<PayrollPortalTab>('landing');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

  const activePeriod = periods.find(p => p.id === selectedPeriodId) || periods[0];
  const projectPlans = payrollService.getProjectPayrollPlans();
  const quickPayouts = payrollService.getQuickPayouts();
  const statutoryRecords = payrollService.getStatutoryRecords();

  const totalProjectLaborPlanned = projectPlans.reduce((acc, p) => acc + (p.isActive ? p.totalPlannedCost : 0), 0);
  const totalQuickPayouts = quickPayouts.reduce((acc, p) => acc + p.amount, 0);
  const totalStatutoryLiability = statutoryRecords.reduce((acc, s) => acc + s.totalStatutoryRemittance, 0);

  const handleApprovePayroll = (periodId: string) => {
    const canApprove = hasPermission('payroll.approve') || currentUser?.roleId === 'role-superadmin' || currentUser?.roleId === 'role-finmgr';
    if (!canApprove) {
      setStatusMessage({
        type: 'error',
        text: 'Permission Denied: Only Head of Finance or Executive Leadership can approve monthly payroll releases.'
      });
      return;
    }

    const updated = payrollService.approvePayroll(periodId, currentUser?.fullName || 'Elena Rostova');
    if (updated) {
      setPeriods(payrollService.getPayrollPeriods());
      setStatusMessage({
        type: 'success',
        text: `Payroll cycle ${updated.cycleNumber} approved by ${currentUser?.fullName || 'Finance Manager'}. Ready for WPS disbursement.`
      });
    }
  };

  const [editingEmployee, setEditingEmployee] = useState<EmployeePayrollItem | null>(null);

  const handleDownloadPayslipPDF = async (emp: EmployeePayrollItem, periodMonth: string) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const rightEdge = pageWidth - margin;

      // Header
      const logoDataUrl = getCompanyLogoDataUrl();
      if (logoDataUrl) {
        drawCompanyLogoAtActualWidth(doc, logoDataUrl, rightEdge, 8, 10, 42);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(29, 78, 216); // Royal Blue
      doc.text('INNOVISTA', margin, 15);
      const firstWordWidth = doc.getTextWidth('INNOVISTA');
      doc.setTextColor(15, 23, 42);
      doc.text(' METAL FABRICONIX (PVT) LTD.', margin + firstWordWidth, 15);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('Corporate Human Capital & Workforce Compensation Division | Reg: PV-98124', margin, 20);
      doc.text('No. 50/B, Vishaka Place, Elapitiwela, Ragama | Tel: 077 1684 620', margin, 24);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(29, 78, 216);
      doc.text('OFFICIAL EMPLOYEE SALARY PAYSLIP', rightEdge, 22, { align: 'right' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(`Pay Period: ${periodMonth}`, rightEdge, 26.5, { align: 'right' });
      doc.text(`Slip No: SLP-${emp.employeeId}-${periodMonth.replace(/\s+/g, '')}`, rightEdge, 30.5, { align: 'right' });

      doc.setDrawColor(29, 78, 216);
      doc.setLineWidth(0.5);
      doc.line(margin, 34, rightEdge, 34);

      // Section 1: Employee Particulars
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('1. Employee Particulars & Banking Information', margin, 40);

      const employeeRows = [
        ['Employee Name', emp.employeeName, 'Employee ID', emp.employeeId],
        ['Designation', emp.designation, 'Department', emp.department],
        ['Plant / Branch', emp.branch, 'Payment Method', 'WPS Direct Bank Transfer'],
        ['Bank Name', emp.bankName, 'Account / IBAN', emp.iban],
        ['WPS Routing Code', emp.wpsRoutingCode, 'Disbursement Status', emp.paymentStatus || 'Verified & Certified']
      ];

      autoTable(doc, {
        startY: 43,
        body: employeeRows,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2.2, fillColor: [255, 255, 255], textColor: [15, 23, 42], lineColor: [203, 213, 225], lineWidth: 0.2 },
        columnStyles: {
          0: { cellWidth: 32, fontStyle: 'bold' },
          1: { cellWidth: 59 },
          2: { cellWidth: 32, fontStyle: 'bold' },
          3: { cellWidth: 59 }
        },
        margin: { left: margin, right: margin }
      });

      const sec1FinalY = (doc as any).lastAutoTable?.finalY || 75;

      // Section 2: Compensation & Earnings Breakdown Table
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('2. Compensation & Earnings Breakdown', margin, sec1FinalY + 7);

      const grossSalary = (emp.basicSalary || 0) + (emp.housingAllowance || 0) + (emp.transportAllowance || 0) + (emp.overtimeTotal || 0) + (emp.performanceBonus || 0);

      const earningsHead = [['Ref', 'Earnings Component', 'Rate / Details', 'Amount (AED)']];
      const earningsBody = [
        ['E-01', 'Basic Base Wage / Salary', 'Standard Contract Base', `AED ${emp.basicSalary.toLocaleString()}`],
        ['E-02', 'Housing & Accommodation Allowance', 'Monthly Statutory', `AED ${emp.housingAllowance.toLocaleString()}`],
        ['E-03', 'Transport & Travel Allowance', 'Site Logistics / Commute', `AED ${emp.transportAllowance.toLocaleString()}`],
        ['E-04', `Overtime Production Hours (${emp.overtimeHours} hrs logged)`, 'Supervisor Certified Time', `AED ${emp.overtimeTotal.toLocaleString()}`],
        ['E-05', 'Performance & Special Project Incentive', 'Quarterly/Monthly KPI', `AED ${(emp.performanceBonus || 0).toLocaleString()}`],
        ['', 'GROSS EARNINGS TOTAL', 'Total Pre-Deductions', `AED ${grossSalary.toLocaleString()}`]
      ];

      autoTable(doc, {
        startY: sec1FinalY + 10,
        head: earningsHead,
        body: earningsBody,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2.2, fillColor: [255, 255, 255], textColor: [15, 23, 42], lineColor: [203, 213, 225], lineWidth: 0.2 },
        headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontStyle: 'bold', lineColor: [203, 213, 225], lineWidth: 0.2 },
        columnStyles: {
          0: { cellWidth: 16, fontStyle: 'bold' },
          1: { cellWidth: 84 },
          2: { cellWidth: 46 },
          3: { cellWidth: 36, halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: margin, right: margin }
      });

      const sec2FinalY = (doc as any).lastAutoTable?.finalY || 135;

      // Section 3: Deductions & Net Take-Home Remuneration
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('3. Deductions & Net Take-Home Remuneration', margin, sec2FinalY + 7);

      const netSalary = grossSalary - (emp.totalDeductions || 0);

      const deductionsHead = [['Ref', 'Deduction / Reconciliation Item', 'Category', 'Amount (AED)']];
      const deductionsBody = [
        ['D-01', 'Absence, Unpaid Leave & Late Penalties', 'Attendance Ledger', emp.totalDeductions > 0 ? `-AED ${emp.totalDeductions.toLocaleString()}` : 'AED 0.00'],
        ['D-02', 'Staff Advance & Internal Loan Recovery', 'Finance Recovery', 'AED 0.00'],
        ['', 'TOTAL STATUTORY & OTHER DEDUCTIONS', 'Sum of Deductions', emp.totalDeductions > 0 ? `-AED ${emp.totalDeductions.toLocaleString()}` : 'AED 0.00'],
        ['', 'NET SALARY PAYABLE (WPS REMITTANCE)', 'Direct Credit to Employee Account', `AED ${netSalary.toLocaleString()}`]
      ];

      autoTable(doc, {
        startY: sec2FinalY + 10,
        head: deductionsHead,
        body: deductionsBody,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2.2, fillColor: [255, 255, 255], textColor: [15, 23, 42], lineColor: [203, 213, 225], lineWidth: 0.2 },
        headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontStyle: 'bold', lineColor: [203, 213, 225], lineWidth: 0.2 },
        columnStyles: {
          0: { cellWidth: 16, fontStyle: 'bold' },
          1: { cellWidth: 84 },
          2: { cellWidth: 46 },
          3: { cellWidth: 36, halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: margin, right: margin }
      });

      const sec3FinalY = (doc as any).lastAutoTable?.finalY || 195;

      // Barcodes & QR
      const slipCode = `SLP-${emp.employeeId}-${periodMonth.replace(/\s+/g, '')}`;
      const barcodeDataUrl = generateBarcodeDataUrl(slipCode);
      const qrDataUrl = await generateQRCodeDataUrl(slipCode);

      // Signatures
      const sigY = Math.min(sec3FinalY + 12, pageHeight - 48);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);

      // Employee Signature
      doc.line(margin + 5, sigY + 14, margin + 45, sigY + 14);
      doc.text('Employee Signature', margin + 10, sigY + 18);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Received: ${emp.employeeName}`, margin + 8, sigY + 22);

      // HR Signature
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.line(margin + 68, sigY + 14, margin + 108, sigY + 14);
      doc.text('HR Manager Signature', margin + 70, sigY + 18);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Certified for WPS Release', margin + 72, sigY + 22);

      // Finance Controller
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.line(rightEdge - 45, sigY + 14, rightEdge - 5, sigY + 14);
      doc.text('Finance Controller', rightEdge - 42, sigY + 18);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Bank Disbursement Approved', rightEdge - 44, sigY + 22);

      // Footer
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 16, rightEdge, pageHeight - 16);

      if (qrDataUrl) {
        try {
          doc.addImage(qrDataUrl, 'PNG', margin, pageHeight - 15, 10, 10);
        } catch {}
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(71, 85, 105);
      doc.text('VERIFIED', margin + 5, pageHeight - 4.5, { align: 'center' });

      if (barcodeDataUrl) {
        try {
          doc.addImage(barcodeDataUrl, 'PNG', pageWidth / 2 - 20, pageHeight - 15, 40, 5);
        } catch {}
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);
      doc.text(slipCode, pageWidth / 2, pageHeight - 8.5, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text('Innovista Central Payroll ERP System & WPS Ledger', pageWidth / 2, pageHeight - 5, { align: 'center' });
      doc.text('Page 1 of 1', rightEdge, pageHeight - 8.5, { align: 'right' });

      doc.save(`Payslip_${emp.employeeId}_${periodMonth.replace(/\s+/g, '_')}.pdf`);
      toast.success(`Payslip for ${emp.employeeName} downloaded as PDF`);
    } catch (err) {
      console.error('Payslip PDF generation error', err);
      toast.error('Failed to generate payslip PDF');
    }
  };

  const handleSaveEditedEmployee = (updated: EmployeePayrollItem) => {
    const res = payrollService.updateEmployeePayrollItem(activePeriod.id, updated);
    if (res) {
      setPeriods(payrollService.getPayrollPeriods());
      setEditingEmployee(null);
      if (selectedEmployeeSlip?.id === updated.id) {
        setSelectedEmployeeSlip(res);
      }
      toast.success(`Updated payroll for ${updated.employeeName}`);
    } else {
      toast.error('Failed to update employee record');
    }
  };

  const handleDeleteEmployee = (empId: string, empName: string) => {
    if (window.confirm(`Delete payroll entry for ${empName}?`)) {
      const ok = payrollService.deleteEmployeePayrollItem(activePeriod.id, empId);
      if (ok) {
        setPeriods(payrollService.getPayrollPeriods());
        if (selectedEmployeeSlip?.id === empId) {
          setSelectedEmployeeSlip(null);
        }
        toast.success(`Removed ${empName} from payroll register`);
      } else {
        toast.error('Failed to delete employee item');
      }
    }
  };

  const handleSyncBiometrics = () => {
    const res = payrollService.syncFromBiometricsAndTimesheets(selectedPeriodId);
    setPeriods(payrollService.getPayrollPeriods());
    setStatusMessage({
      type: 'success',
      text: `Biometrics & Timesheets synchronized: Updated ${res.updatedEmployees} employee records. Total recalculated overtime: AED ${res.totalOvertimePay.toLocaleString()}.`
    });
    toast.success('Biometric Ingestion Synced', {
      description: `Ingested latest biometric turnstile & laser gun logs for ${res.updatedEmployees} personnel.`
    });
  };

  const handleDisbursePayroll = (periodId: string) => {
    const updated = payrollService.disbursePayroll(periodId);
    if (updated) {
      setPeriods(payrollService.getPayrollPeriods());
      setStatusMessage({
        type: 'success',
        text: `WPS Batch ${updated.wpsBatchReference} successfully transmitted to Central Bank WPS portal. All payslips finalized.`
      });
      toast.success(`Payroll Disbursed`, {
        description: `WPS Batch transmitted successfully.`
      });
    } else {
      toast.error('Failed to disburse payroll cycle');
    }
  };

  return (
    <div className="space-y-5 text-slate-800">
      
      {/* Flash Status Message */}
      {statusMessage && (
        <div className={`p-3.5 rounded-xl flex items-center justify-between text-xs border shadow-xs animate-in fade-in ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
          statusMessage.type === 'warning' ? 'bg-amber-50 text-amber-800 border-amber-200' :
          'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span className="font-semibold">{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-700 font-bold px-2 cursor-pointer">&times;</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. SIMPLE WHITE BACKGROUND TITLE BAR (NO DARK BLUE, NO DESCRIPTION)       */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-slate-900 whitespace-nowrap">
              Payroll & Workforce Accounting
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              WPS & Multi-Tier Budgets
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="bg-slate-50 text-slate-800 border border-slate-200 text-xs px-2.5 py-1.5 rounded-lg outline-none font-semibold cursor-pointer"
          >
            {periods.map(p => (
              <option key={p.id} value={p.id}>{p.month} ({p.status})</option>
            ))}
          </select>

          <button
            onClick={handleSyncBiometrics}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            title="Sync plant biometric turnstile records & calculate overtime"
          >
            <Fingerprint size={13} className="text-orange-400" />
            <span>Sync Biometrics</span>
          </button>

          {activePeriod?.status === 'Pending Review' && (
            <button
              onClick={() => handleApprovePayroll(activePeriod.id)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <CheckCircle2 size={13} />
              <span>Authorize Release</span>
            </button>
          )}

          {activePeriod?.status === 'Approved' && (
            <button
              onClick={() => handleDisbursePayroll(activePeriod.id)}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Landmark size={13} />
              <span>Transmit WPS Batch</span>
            </button>
          )}

          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activePeriod, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", `WPS_SIF_${activePeriod.cycleNumber}.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <Download size={13} className="text-slate-500" />
            <span>Export SIF</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUB-PORTAL NAVIGATION TABS                                             */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex items-center gap-1 overflow-x-auto shadow-xs text-xs">
        {[
          { id: 'landing', label: 'Command Hub', icon: LayoutDashboard },
          { id: 'advanced-paysheet', label: 'Paysheet, EPF/ETF & Loans', icon: Scale },
          { id: 'project-payroll', label: 'Project Payroll', icon: Building2 },
          { id: 'dept-payroll', label: 'Department Payroll', icon: FolderTree },
          { id: 'statutory', label: 'Statutory (EPF/ETF)', icon: Scale },
          { id: 'quick-payouts', label: `Payouts (${quickPayouts.length})`, icon: CreditCard },
          { id: 'monthly-register', label: `Register (${activePeriod.month})`, icon: Landmark }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as PayrollPortalTab)}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer border ${
                isActive
                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                  : 'bg-white text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LANDING PAGE COMMAND CENTER (CARDS FOR ALL PORTALS LIKE HOME)      */}
      {/* ========================================================================= */}
      {activeTab === 'landing' && (
        <div className="space-y-6">
          
          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Net Monthly Commitment
              </span>
              <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                AED {activePeriod.totalNetPayable.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {activePeriod.totalEmployees} Active staff &bull; WPS {activePeriod.status}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Project Labor Budget
              </span>
              <div className="text-xl font-bold text-blue-700 font-mono mt-1">
                AED {totalProjectLaborPlanned.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Across {projectPlans.length} active multi-tier labor plans
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Statutory EPF/ETF Remittance
              </span>
              <div className="text-xl font-bold text-indigo-700 font-mono mt-1">
                AED {totalStatutoryLiability.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Matched with Bank Ledger (23%)</span>
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Quick Payouts & Advances
              </span>
              <div className="text-xl font-bold text-amber-700 font-mono mt-1">
                AED {totalQuickPayouts.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {quickPayouts.length} Instant site cash & advances disbursed
              </span>
            </div>
          </div>

          {/* MAIN COMMAND CENTER PORTAL CARDS (LIKE THE HOME PAGE) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* CARD 1: PROJECT-BASED PAYROLL & LABOR BUDGETS */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-400 transition-all">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                    Project Labor Budgets
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Project-Based Payroll Portal
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Create multiple labor plans per project, edit man-day budgets, compare with actual logged hours, and generate labor cost reports.
                  </p>
                </div>

                {/* Subportal Command Buttons */}
                <div className="pt-2 space-y-1.5 text-xs">
                  <button
                    onClick={() => setActiveTab('project-payroll')}
                    className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>&bull; ABC Commercial Factory Fitting (Plan A)</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => setActiveTab('project-payroll')}
                    className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>&bull; Metropolitan Luxury Tower Façade (Plan A)</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => setActiveTab('project-payroll')}
                    className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>&bull; Compare Planned vs Actual Timesheets</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('project-payroll')}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Open Project Payroll Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* CARD 2: DEPARTMENT-BASED PAYROLL & HEADCOUNT BUDGETS */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-400 transition-all">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <FolderTree className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                    Cost Center Burn
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Department-Based Payroll Portal
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Departmental salary registers, operational budget caps, and multi-tier burn rate comparisons across fabrication and commercial divisions.
                  </p>
                </div>

                {/* Subportal Command Buttons */}
                <div className="pt-2 space-y-1.5 text-xs">
                  <button
                    onClick={() => setActiveTab('dept-payroll')}
                    className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-medium flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>&bull; Fabrication, Site & Operations (74.2% Burn)</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => setActiveTab('dept-payroll')}
                    className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-medium flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>&bull; Commercial & Admin (68.4% Burn)</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => setActiveTab('dept-payroll')}
                    className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-medium flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>&bull; Procurement & Supply Chain (51.2% Burn)</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('dept-payroll')}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Open Department Payroll Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* CARD 3: ACCOUNTING & STATUTORY RECONCILIATION */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-400 transition-all">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                    <Scale className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                    PF 8%+12% & ETF 3%
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Accounting & Statutory Reconciliation
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Compare payroll ledgers with accounting cash and bank payouts, track employee/employer PF, ETF contributions, and generate audit reports.
                  </p>
                </div>

                {/* Subportal Command Buttons */}
                <div className="pt-2 space-y-1.5 text-xs">
                  <button
                    onClick={() => setActiveTab('statutory')}
                    className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-800 text-slate-700 font-medium flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>&bull; Statutory Remittance Ledger (AED 33,660)</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => setActiveTab('statutory')}
                    className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-800 text-slate-700 font-medium flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>&bull; Reconcile with Commercial Bank Records</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => setActiveTab('statutory')}
                    className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-800 text-slate-700 font-medium flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>&bull; APIT & Tax Withholding Statements</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('statutory')}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Open Statutory Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* CARD 4: QUICK PAYOUTS, ADVANCES & EXPENSE VOUCHERS */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-400 transition-all">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                    Instant Vouchers
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Quick Payouts & Advances Portal
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Record quick site cash per diems, employee salary advances, overtime cash payouts, and print official disbursement vouchers.
                  </p>
                </div>

                {/* Subportal Command Buttons */}
                <div className="pt-2 space-y-1.5 text-xs">
                  <button
                    onClick={() => setActiveTab('quick-payouts')}
                    className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-amber-50 hover:text-amber-800 text-slate-700 font-medium flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>&bull; Record New Quick Payout</span>
                    <Plus className="w-3.5 h-3.5 text-amber-600" />
                  </button>
                  <button
                    onClick={() => setActiveTab('quick-payouts')}
                    className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-amber-50 hover:text-amber-800 text-slate-700 font-medium flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>&bull; Active Salary Advances Ledger</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => setActiveTab('quick-payouts')}
                    className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-amber-50 hover:text-amber-800 text-slate-700 font-medium flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>&bull; Site Per Diem & Cash Overtime Vouchers</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('quick-payouts')}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Open Quick Payouts Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* CARD 5: MONTHLY SALARY REGISTER & CENTRAL BANK WPS */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-400 transition-all md:col-span-2">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-800">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 font-mono">
                    WPS Cycle {activePeriod.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Monthly Salary Register & WPS Central Bank Batch
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Official monthly salary schedule for {activePeriod.month} ({activePeriod.totalEmployees} employees), overtime reconciliations, bank batch SIF file generation, and payslips.
                  </p>
                </div>

                {/* Subportal Command Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs">
                  <button
                    onClick={() => setActiveTab('monthly-register')}
                    className="text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>&bull; View Complete Salary Register</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => setActiveTab('monthly-register')}
                    className="text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>&bull; Individual Payslips Generation</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('monthly-register')}
                className="w-full py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Open Monthly Salary Register</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-PORTAL VIEWS                                                          */}
      {/* ========================================================================= */}

      {activeTab === 'advanced-paysheet' && (
        <AdvancedCompensationPaysheetHub />
      )}

      {activeTab === 'project-payroll' && (
        <ProjectPayrollPortal onBackToLanding={() => setActiveTab('landing')} />
      )}

      {activeTab === 'dept-payroll' && (
        <DepartmentPayrollPortal onBackToLanding={() => setActiveTab('landing')} />
      )}

      {activeTab === 'statutory' && (
        <StatutoryReconciliationPortal onBackToLanding={() => setActiveTab('landing')} />
      )}

      {activeTab === 'quick-payouts' && (
        <QuickPayoutsPortal onBackToLanding={() => setActiveTab('landing')} />
      )}

      {/* TAB 5: MONTHLY SALARY REGISTER & WPS TABLE */}
      {activeTab === 'monthly-register' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Monthly Salary Register & WPS Schedule ({activePeriod.month})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Corporate banking routing, allowances, overtime reconciliations, and payslip distribution.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('landing')}
                className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
              >
                &larr; Back to Landing
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[10px] uppercase">
                    <th className="py-2.5 px-4">Employee ID & Name</th>
                    <th className="py-2.5 px-4">Department & Role</th>
                    <th className="py-2.5 px-4 text-right">Basic</th>
                    <th className="py-2.5 px-4 text-right">Allowances</th>
                    <th className="py-2.5 px-4 text-right">Overtime</th>
                    <th className="py-2.5 px-4 text-right">Deductions</th>
                    <th className="py-2.5 px-4 text-right font-black bg-blue-50/50">Net Salary</th>
                    <th className="py-2.5 px-4">WPS Routing</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activePeriod.items.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-slate-500 text-[10px] block">{emp.employeeId}</span>
                        <span className="font-bold text-slate-900 block">{emp.employeeName}</span>
                        <span className="text-[10px] text-slate-400">{emp.branch}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[11px] font-medium text-slate-800 block">{emp.designation}</span>
                        <span className="text-[10px] text-orange-600 font-mono font-semibold">{emp.department}</span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        AED {emp.basicSalary.toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        AED {(emp.housingAllowance + emp.transportAllowance).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-amber-600 font-medium">
                        AED {emp.overtimeTotal.toLocaleString()}
                        {emp.overtimeHours > 0 && (
                          <span className="text-[9px] text-slate-400 block font-normal">{emp.overtimeHours} hrs</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-rose-600">
                        {emp.totalDeductions > 0 ? `-AED ${emp.totalDeductions.toLocaleString()}` : '—'}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm bg-blue-50/30">
                        AED {emp.netSalary.toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-slate-800 font-semibold block text-[11px]">{emp.bankName}</span>
                        <span className="font-mono text-[9px] text-slate-400 block truncate max-w-[150px]">{emp.iban}</span>
                      </td>

                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedEmployeeSlip(emp)}
                            className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="View Slip Details"
                          >
                            Slip
                          </button>
                          <button
                            onClick={() => handleDownloadPayslipPDF(emp, activePeriod.month)}
                            className="px-2 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Download Official Payslip PDF"
                          >
                            <Download size={11} />
                            <span>PDF</span>
                          </button>
                          <button
                            onClick={() => setEditingEmployee(emp)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="Edit Employee Payroll"
                          >
                            <Edit2 size={11} />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp.id, emp.employeeName)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                            title="Delete Employee Record"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PAYSLIP PREVIEW & PDF DOWNLOAD                                     */}
      {/* ========================================================================= */}
      {selectedEmployeeSlip && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Official Monthly Salary Slip</h3>
                <p className="text-[11px] text-slate-500">{activePeriod.month} &bull; {selectedEmployeeSlip.employeeName}</p>
              </div>
              <button
                onClick={() => setSelectedEmployeeSlip(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Employee ID:</span>
                <span className="font-mono font-semibold text-slate-800">{selectedEmployeeSlip.employeeId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Designation:</span>
                <span className="font-medium text-slate-800">{selectedEmployeeSlip.designation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="font-medium text-slate-800">{selectedEmployeeSlip.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Branch:</span>
                <span className="font-medium text-slate-800">{selectedEmployeeSlip.branch}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Basic Salary:</span>
                <span className="font-mono">AED {selectedEmployeeSlip.basicSalary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Housing Allowance:</span>
                <span className="font-mono">AED {selectedEmployeeSlip.housingAllowance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Transport Allowance:</span>
                <span className="font-mono">AED {selectedEmployeeSlip.transportAllowance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>Overtime Compensation ({selectedEmployeeSlip.overtimeHours} hrs):</span>
                <span className="font-mono">AED {selectedEmployeeSlip.overtimeTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-rose-700">
                <span>Absence / Loan Deductions:</span>
                <span className="font-mono">-AED {selectedEmployeeSlip.totalDeductions.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                <span>Net Transfer Amount:</span>
                <span className="font-mono text-emerald-600">AED {selectedEmployeeSlip.netSalary.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-[10px] text-slate-500 font-mono space-y-0.5">
              <div>Bank: {selectedEmployeeSlip.bankName}</div>
              <div>IBAN: {selectedEmployeeSlip.iban}</div>
              <div>WPS Routing: {selectedEmployeeSlip.wpsRoutingCode}</div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleDownloadPayslipPDF(selectedEmployeeSlip, activePeriod.month)}
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Download size={13} />
                <span>Download Payslip as PDF (Official Doc)</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer w-1/2"
                >
                  <Printer size={13} />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setSelectedEmployeeSlip(null)}
                  className="px-3 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold cursor-pointer w-1/2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT EMPLOYEE PAYROLL RECORD                                       */}
      {/* ========================================================================= */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Edit Employee Payroll Entry</h3>
                <p className="text-[11px] text-slate-500">{editingEmployee.employeeName} ({editingEmployee.employeeId})</p>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingEmployee.employeeName}
                  onChange={e => setEditingEmployee({ ...editingEmployee, employeeName: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Designation</label>
                <input
                  type="text"
                  value={editingEmployee.designation}
                  onChange={e => setEditingEmployee({ ...editingEmployee, designation: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Department</label>
                <select
                  value={editingEmployee.department}
                  onChange={e => setEditingEmployee({ ...editingEmployee, department: e.target.value as EmployeePayrollItem['department'] })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 bg-white"
                >
                  <option value="COMMERCIAL_ADMIN">Commercial & Administration</option>
                  <option value="OPERATIONS">Fabrication & Site Operations</option>
                  <option value="PROCUREMENT_SUPPLY_CHAIN">Procurement & Supply Chain</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Basic Salary (AED)</label>
                <input
                  type="number"
                  value={editingEmployee.basicSalary}
                  onChange={e => setEditingEmployee({ ...editingEmployee, basicSalary: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Housing Allowance (AED)</label>
                <input
                  type="number"
                  value={editingEmployee.housingAllowance}
                  onChange={e => setEditingEmployee({ ...editingEmployee, housingAllowance: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Transport Allowance (AED)</label>
                <input
                  type="number"
                  value={editingEmployee.transportAllowance}
                  onChange={e => setEditingEmployee({ ...editingEmployee, transportAllowance: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Overtime Hours</label>
                <input
                  type="number"
                  value={editingEmployee.overtimeHours}
                  onChange={e => {
                    const hrs = Number(e.target.value) || 0;
                    const otRate = editingEmployee.basicSalary > 0 ? (editingEmployee.basicSalary / 200) * 1.5 : 25;
                    setEditingEmployee({ 
                      ...editingEmployee, 
                      overtimeHours: hrs,
                      overtimeTotal: Math.round(hrs * otRate)
                    });
                  }}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Total Deductions (AED)</label>
                <input
                  type="number"
                  value={editingEmployee.totalDeductions}
                  onChange={e => setEditingEmployee({ ...editingEmployee, totalDeductions: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 border border-rose-200 rounded-lg text-xs font-mono text-rose-700"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Bank Name</label>
                <input
                  type="text"
                  value={editingEmployee.bankName}
                  onChange={e => setEditingEmployee({ ...editingEmployee, bankName: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">IBAN Account</label>
                <input
                  type="text"
                  value={editingEmployee.iban}
                  onChange={e => setEditingEmployee({ ...editingEmployee, iban: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingEmployee(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer w-1/2"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveEditedEmployee(editingEmployee)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer w-1/2"
              >
                <Save size={13} />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
