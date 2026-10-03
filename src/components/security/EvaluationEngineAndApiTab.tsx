import React, { useState, useMemo } from 'react';
import {
  Cpu,
  CheckCircle2,
  XCircle,
  KeyRound,
  RefreshCw,
  Flame,
  Sliders,
  Play,
  Plus,
  Copy
} from 'lucide-react';
import {
  SecurityUser,
  CentralPortalId,
  ConnectedApplicationClient,
  BreakGlassEmergencySession,
  SecurityPolicyConfiguration,
  ApiScopeCode
} from '../../types/security';
import { securityService } from '../../services/securityService';
import { ALL_API_SCOPES } from '../../services/enterpriseSecurityRegistry';

interface EvaluationEngineAndApiTabProps {
  mode: 'EVALUATION_ENGINE' | 'API_APPS_AND_BREAKGLASS';
  users: SecurityUser[];
  actorUsername: string;
  isAdminAuthority: boolean;
  onRefresh: () => void;
  onNotify: (msg: string) => void;
}

export const EvaluationEngineAndApiTab: React.FC<EvaluationEngineAndApiTabProps> = ({
  mode,
  users,
  actorUsername,
  isAdminAuthority,
  onRefresh,
  onNotify
}) => {
  const portals = useMemo(() => securityService.getPortalRegistry(), []);
  const permissions = useMemo(() => securityService.getPermissions(), []);
  const recordGrants = useMemo(() => securityService.getRecordAccessGrants(), []);

  // Simulator inputs
  const [simUserId, setSimUserId] = useState<string>(users[8]?.id || users[1]?.id || users[0]?.id || '');
  const [simPortalId, setSimPortalId] = useState<CentralPortalId>('factory-workshop-management');
  const [simPermCode, setSimPermCode] = useState<string>('execution.submit');
  const [simProjectId, setSimProjectId] = useState<string>('PRJ-2026-001');
  const [simFactoryId, setSimFactoryId] = useState<string>('fac-ext-01');
  const [simBranch, setSimBranch] = useState<string>('');
  const [simRecordId, setSimRecordId] = useState<string>('');
  const [emitAuditOnDeny, setEmitAuditOnDeny] = useState<boolean>(true);

  const trace = useMemo(() => {
    return securityService.evaluateCentralAuthorization({
      userId: simUserId,
      permissionCode: simPermCode,
      portalId: simPortalId,
      targetProjectId: simProjectId || undefined,
      targetFactoryId: simFactoryId || undefined,
      targetBranch: simBranch || undefined,
      targetRecordId: simRecordId || undefined,
      emitAuditOnDeny: false
    });
  }, [simUserId, simPermCode, simPortalId, simProjectId, simFactoryId, simBranch, simRecordId]);

  const handleLogLiveEvaluation = () => {
    const result = securityService.evaluateCentralAuthorization({
      userId: simUserId,
      permissionCode: simPermCode,
      portalId: simPortalId,
      targetProjectId: simProjectId || undefined,
      targetFactoryId: simFactoryId || undefined,
      targetBranch: simBranch || undefined,
      targetRecordId: simRecordId || undefined,
      emitAuditOnDeny
    });
    onRefresh();
    onNotify(
      `Executed 13-Step Evaluation (${result.evaluationId}): ${result.allowed ? 'ALLOWED' : 'DENIED'}.`
    );
  };

  // Connected Apps & Break-Glass state
  const [apps, setApps] = useState<ConnectedApplicationClient[]>(() =>
    securityService.getConnectedApplications()
  );
  const [breakGlassList, setBreakGlassList] = useState<BreakGlassEmergencySession[]>(() =>
    securityService.getBreakGlassSessions()
  );
  const [policy, setPolicy] = useState<SecurityPolicyConfiguration>(() =>
    securityService.getSecurityPolicy()
  );
  const [newlyIssuedKey, setNewlyIssuedKey] = useState<string | null>(null);

  // New App form
  const [newAppName, setNewAppName] = useState('');
  const [newAppCode, setNewAppCode] = useState('');
  const [newAppType, setNewAppType] = useState<ConnectedApplicationClient['appType']>('Mobile Application');
  const [newAppScopes, setNewAppScopes] = useState<ApiScopeCode[]>(['project:read', 'factory:read', 'permissions:verify']);

  // API Token Verification Tester
  const [testClientId, setTestClientId] = useState(apps[0]?.clientId || '');
  const [testScope, setTestScope] = useState<ApiScopeCode>('factory:write');
  const [testProjectId, setTestProjectId] = useState('PRJ-2026-001');
  const [testFactoryId, setTestFactoryId] = useState('fac-ext-01');

  // Break-glass activation form
  const [bgUserId, setBgUserId] = useState(users[1]?.id || users[0]?.id || '');
  const [bgRoleElevated, setBgRoleElevated] = useState('Operations Director (Emergency Release)');
  const [bgScope, setBgScope] = useState('Factory: fac-inv-01 / Project: PRJ-2026-001');
  const [bgTicket, setBgTicket] = useState('INC-OPS-2026-901');
  const [bgReason, setBgReason] = useState('');

  const handleRegisterApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminAuthority || !newAppName.trim() || !newAppCode.trim()) return;
    const { client, plainTextApiKey } = securityService.createConnectedApplication(
      {
        appCode: newAppCode.trim().toUpperCase(),
        appName: newAppName.trim(),
        appType: newAppType,
        status: 'Active',
        grantedScopes: newAppScopes,
        restrictedProjectIds: ['*'],
        restrictedFactoryIds: ['*'],
        rateLimitPerMinute: 600,
        createdBy: actorUsername
      },
      actorUsername
    );
    setApps(securityService.getConnectedApplications());
    setNewlyIssuedKey(`${client.appName}: ${plainTextApiKey}`);
    setNewAppName('');
    setNewAppCode('');
    onRefresh();
    onNotify(`Registered application [${client.appName}] and issued API credentials.`);
  };

  const handleRotateKey = (appId: string) => {
    if (!isAdminAuthority) return;
    const { client, plainTextApiKey } = securityService.rotateApplicationApiKey(appId, actorUsername);
    setApps(securityService.getConnectedApplications());
    setNewlyIssuedKey(`${client.appName} (Rotated): ${plainTextApiKey}`);
    onRefresh();
    onNotify(`Rotated cryptographic API key for [${client.appName}].`);
  };

  const handleRevokeApp = (appId: string) => {
    if (!isAdminAuthority) return;
    securityService.revokeConnectedApplication(appId, actorUsername);
    setApps(securityService.getConnectedApplications());
    onRefresh();
    onNotify('Updated connected application token status.');
  };

  const handleActivateBreakGlass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminAuthority || !bgReason.trim()) return;
    const u = users.find(x => x.id === bgUserId) || users[0];
    const session = securityService.activateBreakGlassSession({
      activatedByUserId: u.id,
      activatedByName: u.fullName,
      authorizedByAdminName: actorUsername,
      targetRoleElevated: bgRoleElevated,
      targetScope: bgScope,
      reason: bgReason.trim(),
      incidentTicketRef: bgTicket.trim() || 'INC-EMG-001',
      durationMinutes: 120
    });
    setBreakGlassList(securityService.getBreakGlassSessions());
    setBgReason('');
    onRefresh();
    onNotify(`Break-Glass Emergency Session [${session.sessionCode}] activated for ${u.fullName}!`);
  };

  const handleTerminateBreakGlass = (sessionId: string) => {
    securityService.terminateBreakGlassSession(sessionId, actorUsername);
    setBreakGlassList(securityService.getBreakGlassSessions());
    onRefresh();
    onNotify('Break-Glass Emergency Session terminated and sealed.');
  };

  const handleTogglePolicyFlag = (key: keyof SecurityPolicyConfiguration) => {
    if (!isAdminAuthority) return;
    const nextVal = !policy[key];
    const updated = securityService.updateSecurityPolicy({ [key]: nextVal }, actorUsername);
    setPolicy(updated);
    onRefresh();
    onNotify(`Updated security policy [${key}] -> ${String(nextVal)}.`);
  };

  if (mode === 'EVALUATION_ENGINE') {
    return (
      <div className="space-y-6">
        {/* Simulator Control Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">
                Single Authoritative Authorization Pipeline
              </span>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-orange-500" />
                13-Step Central Permission Evaluation Engine & Diagnostic Simulator
              </h3>
              <p className="text-xs text-slate-500">
                Every portal, API endpoint, project query, factory worksheet, and confidential record passes through this deterministic 13-gate pipeline.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogLiveEvaluation}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-orange-400" />
              Execute & Commit to Audit Ledger
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                1. Target User Identity
              </label>
              <select
                value={simUserId}
                onChange={e => setSimUserId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} (@{u.username} — {u.roleName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                2. Target Enterprise Portal
              </label>
              <select
                value={simPortalId}
                onChange={e => setSimPortalId(e.target.value as CentralPortalId)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              >
                {portals.map(p => (
                  <option key={p.portalId} value={p.portalId}>
                    {p.shortName} ({p.portalId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                3. Requested Module.Action Permission
              </label>
              <select
                value={simPermCode}
                onChange={e => setSimPermCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
              >
                {permissions.slice(0, 180).map(perm => (
                  <option key={perm.code} value={perm.code}>
                    {perm.code} ({perm.riskLevel})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                4. Project Scope Context
              </label>
              <select
                value={simProjectId}
                onChange={e => setSimProjectId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
              >
                <option value="">No Specific Project</option>
                <option value="PRJ-2026-001">PRJ-2026-001 (Sapphire Marina Tower)</option>
                <option value="PRJ-2026-002">PRJ-2026-002 (Orion Skybridge)</option>
                <option value="PRJ-2026-003">PRJ-2026-003 (Emerald Bay Hospital)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                5. Factory / Workshop Scope Context
              </label>
              <select
                value={simFactoryId}
                onChange={e => setSimFactoryId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
              >
                <option value="">No Specific Factory</option>
                <option value="fac-inv-01">fac-inv-01 (Innovista Colombo Plant)</option>
                <option value="fac-inv-02">fac-inv-02 (Innovista Kandy Steel Workshop)</option>
                <option value="fac-ext-01">fac-ext-01 (Al-Futtaim External Partner Plant)</option>
                <option value="fac-ext-02">fac-ext-02 (Lanka Steel External Workshop)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                6. Branch Context
              </label>
              <select
                value={simBranch}
                onChange={e => setSimBranch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              >
                <option value="">Any Assigned Branch</option>
                <option value="Main Store">Main Store (HQ)</option>
                <option value="Dubai Fabrication Yard">Dubai Fabrication Yard</option>
                <option value="Abu Dhabi Site Hub">Abu Dhabi Site Hub</option>
                <option value="Colombo Central Plant">Colombo Central Plant</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                7. Confidential Record ACL Check
              </label>
              <select
                value={simRecordId}
                onChange={e => setSimRecordId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              >
                <option value="">Standard Operational Record</option>
                {recordGrants.map(rg => (
                  <option key={rg.recordId} value={rg.recordId}>
                    {rg.recordId} — {rg.classification}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 w-full cursor-pointer">
                <input
                  type="checkbox"
                  checked={emitAuditOnDeny}
                  onChange={e => setEmitAuditOnDeny(e.target.checked)}
                />
                Auto-Log Security Alert on Deny
              </label>
            </div>
          </div>

          {/* Decision Banner */}
          <div
            className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
              trace.allowed
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-3">
              {trace.allowed ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-8 h-8 text-rose-600 shrink-0" />
              )}
              <div>
                <div className="text-xs font-black uppercase tracking-wider">
                  Final Authorization Verdict: {trace.allowed ? 'ALLOW (ACCESS GRANTED)' : 'DENY (BLOCKED BY ENGINE)'}
                </div>
                <div className="text-sm font-bold mt-0.5">{trace.summaryExplanation}</div>
              </div>
            </div>
            <span className="font-mono text-xs font-bold px-3 py-1 rounded-lg bg-white/80 border border-slate-200">
              {trace.evaluationId}
            </span>
          </div>

          {/* 13-Step Visual Trace */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {trace.steps.map(st => (
              <div
                key={st.stepNumber}
                className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                  st.passed
                    ? 'bg-white border-slate-200'
                    : 'bg-rose-50/80 border-rose-300 shadow-sm'
                }`}
              >
                {st.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-xs font-black text-slate-900">{st.stepName}</div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{st.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // MODE === 'API_APPS_AND_BREAKGLASS'
  const apiVerificationResult = securityService.verifyApiTokenScope(
    testClientId,
    testScope,
    testProjectId || undefined,
    testFactoryId || undefined
  );

  return (
    <div className="space-y-6">
      {newlyIssuedKey && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-4">
          <div className="text-xs text-amber-950">
            <span className="font-black uppercase block text-amber-700">
              One-Time Cryptographic API Secret Issued (Copy Now — Stored as SHA-256 Hash)
            </span>
            <span className="font-mono font-bold text-sm">{newlyIssuedKey}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(newlyIssuedKey);
              setNewlyIssuedKey(null);
              onNotify('Copied API key to clipboard.');
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" /> Copy & Dismiss
          </button>
        </div>
      )}

      {/* 1. Connected Software Applications & API Scope Gateway */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-orange-500" />
              Connected Software Applications, Mobile Apps & API Scope Gateway ({apps.length} Clients)
            </h3>
            <p className="text-xs text-slate-500">
              External mobile apps, CNC shop-floor telemetry terminals, biometric gates, and partner EDI bridges must authenticate with scoped API tokens.
            </p>
          </div>

          <div className="space-y-3">
            {apps.map(app => (
              <div
                key={app.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col gap-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">{app.appName}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-mono text-[10px] font-bold">
                        {app.appCode}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                        {app.appType}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                      clientId: {app.clientId} • keyPrefix: {app.apiKeyPrefix}... • Rate Limit: {app.rateLimitPerMinute}/min
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        app.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {app.status}
                    </span>
                    {isAdminAuthority && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRotateKey(app.id)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" /> Rotate Key
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRevokeApp(app.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-[11px] font-bold cursor-pointer"
                        >
                          {app.status === 'Revoked' ? 'Reactivate' : 'Revoke'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {app.grantedScopes.map(sc => (
                    <span
                      key={sc}
                      className="px-2 py-0.5 rounded bg-slate-900 text-emerald-300 font-mono text-[10px] font-bold"
                    >
                      {sc}
                    </span>
                  ))}
                </div>
                <div className="text-[10px] text-slate-500 flex flex-wrap items-center justify-between">
                  <span>
                    Project Scope: {app.restrictedProjectIds.join(', ') || 'None'} | Factory Scope:{' '}
                    {app.restrictedFactoryIds.join(', ') || 'None'}
                  </span>
                  <span>Last IP: {app.lastIpAddress || 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Register New Connected App & Live API Scope Verifier */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-orange-500" />
              Register Connected Application
            </h4>
            <form onSubmit={handleRegisterApp} className="space-y-2.5">
              <input
                type="text"
                value={newAppName}
                onChange={e => setNewAppName(e.target.value)}
                placeholder="Application Name"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newAppCode}
                  onChange={e => setNewAppCode(e.target.value)}
                  placeholder="APP-EXT-09"
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                  required
                />
                <select
                  value={newAppType}
                  onChange={e => setNewAppType(e.target.value as any)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold"
                >
                  <option value="Mobile Application">Mobile Application</option>
                  <option value="Shop-Floor Terminal">Shop-Floor Terminal</option>
                  <option value="External Partner Bridge">External Partner Bridge</option>
                  <option value="ERP Microservice">ERP Microservice</option>
                </select>
              </div>
              <div className="max-h-32 overflow-y-auto p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                {ALL_API_SCOPES.map(s => (
                  <label key={s.code} className="flex items-center gap-2 text-[11px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAppScopes.includes(s.code)}
                      onChange={e => {
                        if (e.target.checked) setNewAppScopes([...newAppScopes, s.code]);
                        else setNewAppScopes(newAppScopes.filter(x => x !== s.code));
                      }}
                    />
                    <span className="font-mono font-bold text-slate-800">{s.code}</span>
                    <span className="text-slate-500 truncate">{s.label}</span>
                  </label>
                ))}
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs cursor-pointer"
              >
                Issue Scoped API Client Credentials
              </button>
            </form>
          </div>

          {/* Live API Token Verification Test */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h4 className="text-sm font-black text-slate-900">API Gateway Scope Tester</h4>
            <select
              value={testClientId}
              onChange={e => setTestClientId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
            >
              {apps.map(a => (
                <option key={a.clientId} value={a.clientId}>
                  {a.appName} ({a.clientId})
                </option>
              ))}
            </select>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={testScope}
                onChange={e => setTestScope(e.target.value as ApiScopeCode)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-mono"
              >
                {ALL_API_SCOPES.map(s => (
                  <option key={s.code} value={s.code}>
                    {s.code}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={testProjectId}
                onChange={e => setTestProjectId(e.target.value)}
                placeholder="Project (PRJ-2026-001)"
                className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-mono"
              />
              <input
                type="text"
                value={testFactoryId}
                onChange={e => setTestFactoryId(e.target.value)}
                placeholder="Factory (fac-inv-01)"
                className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-mono"
              />
            </div>
            <div
              className={`p-3 rounded-xl border text-xs font-bold ${
                apiVerificationResult.allowed
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {apiVerificationResult.allowed ? '200 OK — ' : '403 FORBIDDEN — '}
              {apiVerificationResult.reason}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Break-Glass Emergency Access & Global Security Policy Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-600" />
              Break-Glass Emergency Access Protocol (Time-Bound & Audited)
            </h3>
            <p className="text-xs text-slate-500">
              Controlled emergency privilege elevation for critical production or crane dispatch incidents. Every action during Break-Glass is logged to the immutable audit trail.
            </p>
          </div>

          {isAdminAuthority && (
            <form onSubmit={handleActivateBreakGlass} className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 space-y-3">
              <div className="text-xs font-black text-rose-900">Activate Emergency Break-Glass Elevation</div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <select
                  value={bgUserId}
                  onChange={e => setBgUserId(e.target.value)}
                  className="bg-white border border-rose-300 rounded-lg px-2.5 py-2 text-xs font-semibold"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.roleName})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={bgRoleElevated}
                  onChange={e => setBgRoleElevated(e.target.value)}
                  placeholder="Elevated Role"
                  className="bg-white border border-rose-300 rounded-lg px-2.5 py-2 text-xs"
                />
                <input
                  type="text"
                  value={bgScope}
                  onChange={e => setBgScope(e.target.value)}
                  placeholder="Emergency Target Scope"
                  className="bg-white border border-rose-300 rounded-lg px-2.5 py-2 text-xs"
                />
                <input
                  type="text"
                  value={bgTicket}
                  onChange={e => setBgTicket(e.target.value)}
                  placeholder="Incident Ref (INC-2026-901)"
                  className="bg-white border border-rose-300 rounded-lg px-2.5 py-2 text-xs font-mono"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={bgReason}
                  onChange={e => setBgReason(e.target.value)}
                  placeholder="Mandatory emergency justification (e.g. Midnight tower crane FAT release)..."
                  className="flex-1 bg-white border border-rose-300 rounded-lg px-3 py-2 text-xs"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-black cursor-pointer"
                >
                  Activate (2h TTL)
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2.5">
            {breakGlassList.map(bg => (
              <div key={bg.id} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-rose-600">{bg.sessionCode}</span>
                    <span className="text-xs font-black text-slate-900">{bg.activatedByName}</span>
                    <span className="text-[11px] text-slate-500">→ {bg.targetRoleElevated}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        bg.status === 'Active'
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {bg.status}
                    </span>
                    {bg.status === 'Active' && isAdminAuthority && (
                      <button
                        type="button"
                        onClick={() => handleTerminateBreakGlass(bg.id)}
                        className="px-2.5 py-1 rounded bg-slate-900 text-white text-[10px] font-bold cursor-pointer"
                      >
                        Terminate Now
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-600">{bg.reason}</p>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1">
                  {bg.actionsLogged.map((act, i) => (
                    <div key={i} className="text-[10px] font-mono text-slate-600">
                      • {act}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Security Policy Switches */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-600" />
              Global Zero-Trust Authorization Policy
            </h3>
            <p className="text-xs text-slate-500">
              Authoritative enforcement switches governing the 13-Step Permission Evaluation Engine.
            </p>
          </div>

          <div className="space-y-2.5">
            {(
              [
                {
                  key: 'enforceDenyByDefault',
                  label: 'Enforce Deny-by-Default Security',
                  desc: 'New accounts have zero operational access until explicitly granted a role and scope.'
                },
                {
                  key: 'enforceMandatoryMfaForAdmins',
                  label: 'Mandatory 2FA MFA for Administrators',
                  desc: 'Super Admins and System Admins must have active MFA to execute privileged actions.'
                },
                {
                  key: 'enforceMandatoryMfaForFinance',
                  label: 'Mandatory 2FA MFA for Finance & Payroll',
                  desc: 'Requires MFA verification before treasury PVC or payroll WPS bank release.'
                },
                {
                  key: 'enforceStrictProjectScoping',
                  label: 'Strict Project-Based Access Isolation',
                  desc: 'Filters all project records, BOQs, and variations strictly by assignedProjectIds.'
                },
                {
                  key: 'enforceStrictFactoryScoping',
                  label: 'Strict Factory & Workshop Isolation',
                  desc: 'Isolates work packages, drawings, worksheets, and QC logs to assigned factories.'
                },
                {
                  key: 'enforceExternalOrgIsolation',
                  label: 'Multi-Tenant External Organization Isolation',
                  desc: 'Ensures external factories, customers, and suppliers only access their organization scope.'
                },
                {
                  key: 'requireDualApprovalForHighRiskPrivileges',
                  label: 'Dual Approval for High-Risk Privilege Escalation',
                  desc: 'Requires two-stage manager + admin sign-off for critical permission requests.'
                }
              ] as const
            ).map(item => {
              const active = policy[item.key];
              return (
                <div
                  key={item.key}
                  onClick={() => handleTogglePolicyFlag(item.key)}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100"
                >
                  <div>
                    <div className="text-xs font-black text-slate-900">{item.label}</div>
                    <div className="text-[11px] text-slate-500">{item.desc}</div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase shrink-0 ${
                      active
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {active ? 'ENFORCED' : 'DISABLED'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
