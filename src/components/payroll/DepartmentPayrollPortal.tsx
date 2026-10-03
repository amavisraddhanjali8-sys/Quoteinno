import React, { useState, useMemo } from 'react';
import {
  FolderTree,
  Search,
  X,
  Printer,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { DepartmentBudgetMetric } from '../../types/payroll';
import { payrollService } from '../../services/payrollService';

export interface DepartmentPayrollPortalProps {
  onBackToLanding?: () => void;
}

export const DepartmentPayrollPortal: React.FC<DepartmentPayrollPortalProps> = ({
  onBackToLanding
}) => {
  const [budgets] = useState<DepartmentBudgetMetric[]>(() =>
    payrollService.getBudgets()
  );

  const [selectedDeptCode, setSelectedDeptCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [flash, setFlash] = useState<string | null>(null);

  const filteredBudgets = useMemo(() => {
    return budgets.filter(b =>
      b.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.departmentCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [budgets, searchQuery]);

  const selectedDepartment = useMemo(() => {
    if (!selectedDeptCode) return null;
    return budgets.find(b => b.departmentCode === selectedDeptCode) || null;
  }, [selectedDeptCode, budgets]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 text-slate-800">
      
      {flash && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{flash}</span>
          </div>
          <button onClick={() => setFlash(null)} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Back to Payroll Landing"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <FolderTree className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-slate-900">
                Department-Based Payroll & Headcount Budgets
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Cost Center Burn Rates
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Departmental salary registers, operational budget caps, and multi-tier burn rate comparisons.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedDeptCode && (
            <button
              onClick={() => setSelectedDeptCode(null)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 cursor-pointer"
            >
              All Departments
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-200 shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: ALL DEPARTMENT CARDS */}
      {!selectedDeptCode && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search departments..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {filteredBudgets.length} Departmental Cost Centers
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredBudgets.map(dept => {
              const isHighBurn = dept.ytdBurnRate > 75;

              return (
                <div
                  key={dept.departmentCode}
                  onClick={() => setSelectedDeptCode(dept.departmentCode)}
                  className="bg-white border border-slate-200 hover:border-emerald-400 rounded-xl p-4 shadow-xs transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {dept.departmentCode}
                        </span>
                        <h3 className="text-xs font-bold text-slate-900 mt-1.5 group-hover:text-emerald-700 transition-colors">
                          {dept.departmentName}
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {dept.headcount} Staff
                      </span>
                    </div>

                    {/* Burn rate bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">Annual Burn Rate</span>
                        <span className={`font-bold font-mono ${isHighBurn ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {dept.ytdBurnRate}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${isHighBurn ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(dept.ytdBurnRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400">Annual Budget</div>
                      <div className="font-bold text-slate-900 font-mono">
                        AED {dept.annualBudget.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Committed Payroll</div>
                      <div className="font-bold text-slate-900 font-mono">
                        AED {dept.committedPayroll.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                    <span className="text-slate-500">
                      Remaining: <strong className="text-slate-800 font-mono">AED {dept.remainingBudget.toLocaleString()}</strong>
                    </span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Open Department &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: DEPARTMENT DETAIL & HEADCOUNT ALLOCATION */}
      {selectedDeptCode && selectedDepartment && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {selectedDepartment.departmentCode}
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedDepartment.departmentName}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Annual allocated budget: AED {selectedDepartment.annualBudget.toLocaleString()} &bull; Headcount: {selectedDepartment.headcount}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 font-mono">
                {selectedDepartment.ytdBurnRate}% YTD Burn
              </span>
            </div>
          </div>

          {/* Department Headcount Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Departmental Staff Register & Monthly Commitments
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3">Designation / Role</th>
                    <th className="py-2.5 px-3">Employee Name</th>
                    <th className="py-2.5 px-2 text-right">Basic Monthly</th>
                    <th className="py-2.5 px-2 text-right">Allowances</th>
                    <th className="py-2.5 px-3 text-right font-black bg-emerald-50/50">Total Gross Cost</th>
                    <th className="py-2.5 px-3 text-right">Annual Allocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {payrollService.getPayrollPeriods()[0]?.items
                    .filter(i => i.department === selectedDepartment.departmentCode)
                    .map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {item.designation}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800">{item.employeeName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.employeeId}</div>
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-slate-700">
                          AED {item.basicSalary.toLocaleString()}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-slate-700">
                          AED {(item.housingAllowance + item.transportAllowance).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800 bg-emerald-50/30">
                          AED {item.grossSalary.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          AED {(item.grossSalary * 12).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
