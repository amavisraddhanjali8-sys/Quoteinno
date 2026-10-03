import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Terminal, RefreshCw
} from 'lucide-react';
import { centralApiGateway } from '../../../services/centralApiGateway';
import { CentralAuditRecord } from '../../../types/operationalControl';
import { useSecurity } from '../../../context/SecurityContext';

export const AdminPortal: React.FC = () => {
  const { currentUser, users, roles } = useSecurity();
  const [activeTab, setActiveTab] = useState<'audit' | 'users' | 'roles' | 'procurement_bridge'>('audit');
  const [auditLogs, setAuditLogs] = useState<CentralAuditRecord[]>([]);
  const [selectedAuditLog, setSelectedAuditLog] = useState<CentralAuditRecord | null>(null);

  // Future Procurement Bridge testing state
  const [procurementStatus, setProcurementStatus] = useState<string>('Ready for Inbound Webhooks');
  const [mockPoPayload, setMockPoPayload] = useState(JSON.stringify({
    poNumber: 'PO-EXT-2026-9901',
    supplierName: 'Emirates Steel Industries',
    materialGrade: 'SS316L',
    quantityKg: 12000,
    heatNumber: 'HEAT-9901-EM',
    millCertUrl: 's3://vault/millcerts/MTC-9901.pdf',
    linkedProjectId: 'proj-001'
  }, null, 2));

  useEffect(() => {
    try {
      setAuditLogs(centralApiGateway.getAuditLogs(currentUser));
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  const handleTestProcurementBridge = () => {
    try {
      const parsed = JSON.parse(mockPoPayload);
      const res = centralApiGateway.receiveExternalProcurementWebhook('innovista_procurement_key_2026', {
        poNumber: parsed.poNumber,
        grnNumber: 'GRN-EXT-AUTO-01',
        items: [{
          materialCode: parsed.materialGrade,
          qty: parsed.quantityKg,
          heatNo: parsed.heatNumber
        }]
      });
      setProcurementStatus(`Successfully processed mock PO ${parsed.poNumber}. ${res.message}`);
      setAuditLogs(centralApiGateway.getAuditLogs(currentUser));
    } catch (err: any) {
      alert('Invalid JSON or error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-white">
                Access Control & Governance
              </span>
              <span className="text-xs text-slate-400">RBAC/ABAC Security & Complete Audit Engine</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-slate-900" />
              Enterprise Administration & Audit Engine
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Cryptographically validated audit trails, segregation of duties (SoD), user scopes, and future procurement system integration interfaces.
            </p>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'audit' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Audit Engine Ledger ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'users' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Users & Roles ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'roles' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Permission Matrices ({roles.length})
          </button>
          <button
            onClick={() => setActiveTab('procurement_bridge')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'procurement_bridge' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Future Procurement API Bridge
          </button>
        </div>
      </div>

      {/* Tab: Audit Engine */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Immutable Audit Trail Logs</h4>
              <p className="text-xs text-slate-500">Every mutation records user, action, module, record, diff, IP, and device.</p>
            </div>
            <button
              onClick={() => setAuditLogs(centralApiGateway.getAuditLogs(currentUser))}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
            {auditLogs.map(log => (
              <div 
                key={log.id} 
                onClick={() => setSelectedAuditLog(log)}
                className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{log.action}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">{log.module}</span>
                    <span className="text-slate-500 font-medium">Record: {log.recordId}</span>
                  </div>
                  <div className="text-slate-500 mt-1">
                    Actor: <strong className="text-slate-800">{log.username}</strong> ({log.userRole}) • Device: {log.device} • IP: {log.ipAddress}
                  </div>
                </div>
                <div className="text-right text-slate-400 text-[11px]">
                  {new Date(log.timestamp).toLocaleTimeString()} {new Date(log.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          {/* Audit Diff Modal */}
          {selectedAuditLog && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-xl w-full shadow-2xl space-y-4 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <h3 className="font-bold text-slate-900 text-sm">Audit Record Detail: {selectedAuditLog.id}</h3>
                  <button 
                    onClick={() => setSelectedAuditLog(null)}
                    className="px-2 py-1 bg-slate-100 rounded-lg text-slate-600"
                  >
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>Actor: <strong className="text-slate-900">{selectedAuditLog.username}</strong></div>
                  <div>IP Address: <strong className="text-slate-900">{selectedAuditLog.ipAddress}</strong></div>
                  <div>Module: <strong className="text-slate-900">{selectedAuditLog.module}</strong></div>
                  <div>Target Record: <strong className="text-slate-900">{selectedAuditLog.recordId}</strong></div>
                </div>

                {selectedAuditLog.newValueJson && (
                  <div>
                    <span className="font-bold text-slate-800 block mb-1">Payload / New Value Snapshot:</span>
                    <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-48">
                      {selectedAuditLog.newValueJson}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Users & Roles */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h4 className="text-sm font-bold text-slate-900">Active User Accounts & Permissions Scope</h4>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
            {users.map(u => (
              <div key={u.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{u.fullName}</span>
                    <span className="text-slate-400">(@{u.username})</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700">{u.roleName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">{u.accountStatus}</span>
                  </div>
                  <div className="text-slate-500 mt-1">
                    Dept: <strong>{u.department}</strong> • Default Scope: <strong>{u.defaultScope}</strong> • Branch: {u.branch || 'Global HQ'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Roles */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h4 className="text-sm font-bold text-slate-900">Configured Role Definitions & Permissions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map(r => (
              <div key={r.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{r.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-800">{r.defaultScope}</span>
                </div>
                <p className="text-slate-600">{r.description}</p>
                <div className="text-slate-500 pt-2 border-t border-slate-200 text-[11px]">
                  Permissions count: <strong>{r.permissionCodes.length} Codes</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Procurement Bridge */}
      {activeTab === 'procurement_bridge' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-600" />
              <h4 className="text-sm font-bold text-slate-900">Future Procurement Inbound API / Webhook Bridge</h4>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Simulate external ERP or procurement platform sending Purchase Orders, Goods Receipt Notes (GRN), and Mill Test Certificates (MTC) into our central operational platform.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 text-xs">
            <span className="font-bold text-indigo-950 block">Integration Architecture Note:</span>
            <p className="text-slate-600 mt-1">
              Our central API gateway and PostgreSQL operational schema are pre-architected with supplier PO foreign keys and mill certificate traceability hooks. No redesign will be needed when the procurement application goes live!
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Simulated Inbound Webhook Payload:</label>
            <textarea
              value={mockPoPayload}
              onChange={e => setMockPoPayload(e.target.value)}
              rows={8}
              className="w-full p-3 font-mono text-xs bg-slate-950 text-indigo-300 rounded-xl border border-slate-800 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-600">{procurementStatus}</span>
            <button
              onClick={handleTestProcurementBridge}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Post Inbound Webhook Event
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
