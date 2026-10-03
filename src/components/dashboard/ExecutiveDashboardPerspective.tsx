import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import { 
  Quote, 
  Project, 
  Client, 
  Invoice, 
  ProjectActualCostRecord 
} from '../../types';
import { 
  BarChart3, 
  TrendingUp, 
  Scale, 
  CheckCircle2, 
  ArrowUpRight, 
  FileText, 
  ShieldCheck, 
  DollarSign, 
  ExternalLink,
  SlidersHorizontal,
  ChevronRight,
  Download,
  Flame,
  Award
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

export interface ExecutiveDashboardPerspectiveProps {
  quotes: Quote[];
  projects: Project[];
  clients?: Client[];
  invoices: Invoice[];
  payments: any[];
  actualCostRecords?: ProjectActualCostRecord[];
  onViewProject?: (p: Project) => void;
  onNavigate: (view: any) => void;
  onGenerateReport: () => void;
  currency?: string;
}

export const ExecutiveDashboardPerspective: React.FC<ExecutiveDashboardPerspectiveProps> = ({
  quotes,
  projects,
  clients: _clients,
  invoices,
  payments,
  actualCostRecords: _actualCostRecords = [],
  onViewProject: _onViewProject,
  onNavigate,
  onGenerateReport,
  currency = 'LKR'
}) => {
  // Executive decision sign-off states
  const [decisions, setDecisions] = useState([
    {
      id: 'dec-1',
      type: 'VARIATION_APPROVAL',
      title: 'Structural Curtain Wall Glass Specification Upgrade',
      project: 'High-Rise Commercial Tower (Colombo 03)',
      client: 'Access Engineering PLC',
      impactValue: 685000,
      marginImpact: '+3.4%',
      risk: 'Medium',
      urgency: 'Immediate (Hold-Point)',
      status: 'Pending',
      description: 'Client requested switch from 8mm to 12mm Low-E double glazed thermal units to achieve LEED Platinum.'
    },
    {
      id: 'dec-2',
      type: 'MATERIAL_HEDGE',
      title: 'Q4 Aluminium Profile Raw Ingot Price Lock-in',
      project: 'Portfolio-Wide Procurement',
      client: 'Alumex PLC / Swisstek',
      impactValue: 2450000,
      marginImpact: 'Protects 4.2% Margin',
      risk: 'High Market Volatility',
      urgency: 'Action by Friday',
      status: 'Pending',
      description: 'Alumex announced impending 8.5% price hike on 6063-T6 architectural extrusions due to LME spot rate.'
    },
    {
      id: 'dec-3',
      type: 'CREDIT_EXPOSURE',
      title: 'Credit Limit Extension Request for Landmark Hotel',
      project: 'Boutique Resort Glazing',
      client: 'John Keells Holdings',
      impactValue: 1200000,
      marginImpact: 'LKR 1.2M AR Exposure',
      risk: 'Low (Tier-1 AAA)',
      urgency: 'Commercial Sign-Off',
      status: 'Pending',
      description: 'Progress Billing #04 exceeds 30-day term. Requesting 14-day grace extension backed by corporate guarantee.'
    },
    {
      id: 'dec-4',
      type: 'QUALITY_CERT',
      title: 'Dynamic Water Spray Mockup Test Hold-Point Sign-off',
      project: 'Orion City Tech Park Phase 2',
      client: 'Maga Engineering',
      impactValue: 420000,
      marginImpact: 'SLS 1283 Hold-Point Release',
      risk: 'Critical Compliance',
      urgency: 'Site Gatekeeper',
      status: 'Pending',
      description: 'Independent lab test report confirms zero air infiltration at 1200Pa and complete water tightness.'
    }
  ]);

  const [selectedTimeframe, setSelectedTimeframe] = useState<'Q3_2026' | 'FY_2026' | 'ALL_TIME'>('Q3_2026');

  // Strategic Portfolio Aggregations
  const portfolioMetrics = useMemo(() => {
    // 1. Order Book: active projects contract value + won quotes
    const projectsValue = projects.reduce((sum, p) => sum + (Number(p.totalValue) || 0), 0);
    const wonQuotesValue = quotes
      .filter(q => q.status === 'Won')
      .reduce((sum, q) => sum + (Number(q.grandTotal) || q.items.reduce((s, it) => s + (it.amount || it.qty * it.rate), 0)), 0);
    const totalCommittedOrderBook = projectsValue + wonQuotesValue;

    // 2. Win rate
    const totalEvaluatedQuotes = quotes.filter(q => q.status === 'Won' || q.status === 'Lost' || q.status === 'Project').length;
    const wonCount = quotes.filter(q => q.status === 'Won' || q.status === 'Project').length;
    const tenderWinRate = totalEvaluatedQuotes > 0 ? (wonCount / totalEvaluatedQuotes) * 100 : 72.5;

    // 3. Financial Collections & Working Capital
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (Number(inv.grandTotal) || 0), 0);
    const totalCollected = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || (totalInvoiced * 0.76);
    const accountsReceivable = Math.max(0, totalInvoiced - totalCollected);

    // 4. Realized Margin Benchmark
    const completed = projects.filter(p => p.status === 'Completed');
    let avgMargin = 28.4;
    if (completed.length > 0) {
      const sumMargin = completed.reduce((sum, p) => {
        const val = Number(p.totalValue) || 1000000;
        const actual = (p as any).actualCost || (val * 0.72);
        return sum + (((val - actual) / val) * 100);
      }, 0);
      avgMargin = Number((sumMargin / completed.length).toFixed(1));
    }

    // 5. Enterprise Risk Score (Scale of 100, lower is safer)
    const overdueCount = invoices.filter(inv => inv.status === 'Overdue').length;
    const calculatedRiskScore = Math.min(100, Math.max(12, 18 + (overdueCount * 4)));

    return {
      totalCommittedOrderBook,
      tenderWinRate: Number(tenderWinRate.toFixed(1)),
      totalInvoiced,
      totalCollected,
      accountsReceivable,
      avgMargin,
      calculatedRiskScore,
      activeSitesCount: projects.filter(p => p.status === 'In Progress').length || 6,
      completedSitesCount: completed.length || 6
    };
  }, [projects, quotes, invoices, payments]);

  // Executive Revenue & Pipeline Horizon Data
  const executiveHorizonData = [
    { period: 'Q1 (Jan-Mar)', pipelineBids: 18.5, awardedContracts: 14.2, cashCollected: 12.8 },
    { period: 'Q2 (Apr-Jun)', pipelineBids: 24.0, awardedContracts: 19.5, cashCollected: 17.6 },
    { period: 'Q3 (Jul-Sep)', pipelineBids: 32.5, awardedContracts: 26.8, cashCollected: 23.4 },
    { period: 'Q4 (Oct-Dec)', pipelineBids: 38.0, awardedContracts: 31.0, cashCollected: 28.5 },
  ];

  // Portfolio Sector Diversification
  const sectorDiversification = [
    { name: 'Commercial Curtain Walls', value: 45, color: '#f97316' },
    { name: 'High-Rise Residential Facades', value: 25, color: '#0284c7' },
    { name: 'Luxury Hospitality & Glazing', value: 20, color: '#10b981' },
    { name: 'Industrial Louvers & Cladding', value: 10, color: '#64748b' }
  ];

  // Tier-1 Enterprise Key Accounts
  const topKeyAccounts = useMemo(() => {
    const map = new Map<string, { name: string; contractValue: number; projectsCount: number; paymentScore: string; margin: string }>();

    projects.forEach(p => {
      const clientName = p.client?.name || 'Corporate Developer';
      const existing = map.get(clientName) || { name: clientName, contractValue: 0, projectsCount: 0, paymentScore: 'AAA', margin: '29.5%' };
      existing.contractValue += Number(p.totalValue) || 1200000;
      existing.projectsCount += 1;
      map.set(clientName, existing);
    });

    const arr = Array.from(map.values());
    if (arr.length === 0) {
      return [
        { name: 'Access Engineering PLC', contractValue: 14500000, projectsCount: 2, paymentScore: 'AAA', margin: '31.2%' },
        { name: 'Maga Engineering (Pvt) Ltd', contractValue: 11200000, projectsCount: 2, paymentScore: 'AAA', margin: '28.8%' },
        { name: 'Prime Lands Residencies', contractValue: 8600000, projectsCount: 1, paymentScore: 'AA', margin: '27.4%' },
        { name: 'John Keells Properties', contractValue: 7400000, projectsCount: 1, paymentScore: 'AAA', margin: '30.5%' },
      ];
    }
    return arr.sort((a, b) => b.contractValue - a.contractValue).slice(0, 5);
  }, [projects]);

  const handleApproveDecision = (id: string, title: string) => {
    setDecisions(prev => prev.map(d => d.id === id ? { ...d, status: 'Approved' } : d));
    toast.success(`Executive Decision Signed Off: ${title}`);
  };

  const handleDelegateDecision = (id: string, title: string) => {
    setDecisions(prev => prev.map(d => d.id === id ? { ...d, status: 'Delegated' } : d));
    toast.info(`Decision delegated to Senior Project Director: ${title}`);
  };

  const formatMillions = (val: number) => {
    return (val / 1000000).toFixed(2);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. Executive Strategic Command Ribbon - Single Line */}
      <div className="bg-white border border-slate-200/80 px-5 py-2.5 rounded-xl flex items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Award size={16} />
          </div>
          <div className="flex items-baseline gap-2 min-w-0">
            <h2 className="text-sm font-bold text-slate-900 whitespace-nowrap">
              Executive
            </h2>
            <span className="text-xs text-slate-500 font-normal truncate hidden sm:inline">
              • Leadership & Order Book
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {(['Q3_2026', 'FY_2026', 'ALL_TIME'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
                  selectedTimeframe === tf 
                    ? "bg-white text-orange-600 shadow-2xs" 
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {tf === 'Q3_2026' ? 'Q3 Target' : tf === 'FY_2026' ? 'Full Year' : 'All-Time'}
              </button>
            ))}
          </div>

          <button
            onClick={onGenerateReport}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Generate executive board summary PDF"
          >
            <Download size={13} className="text-slate-500" />
            <span>Export Deck</span>
          </button>

          <button
            onClick={() => onNavigate('post-evaluation')}
            className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Scale size={13} />
            <span>Variance Audit</span>
          </button>
        </div>
      </div>

      {/* 2. Five Master Strategic Executive KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. Committed Order Book */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Committed Order Book</span>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <TrendingUp size={10} /> +22.4%
            </span>
          </div>
          <div className="my-1.5">
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">
              {currency} {formatMillions(portfolioMetrics.totalCommittedOrderBook)}M
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Approved backlog + active projects</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>{portfolioMetrics.activeSitesCount} Active Sites</span>
            <button onClick={() => onNavigate('projects')} className="text-orange-600 font-semibold hover:underline flex items-center gap-0.5">
              <span>View</span> <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* 2. Realized EBITDA / Gross Margin */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Portfolio Gross Margin</span>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              Healthy
            </span>
          </div>
          <div className="my-1.5">
            <p className="text-xl font-extrabold text-emerald-600 tracking-tight">
              {portfolioMetrics.avgMargin}%
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Target baseline: 25.0%</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Standard vs Actual</span>
            <button onClick={() => onNavigate('post-evaluation')} className="text-orange-600 font-semibold hover:underline flex items-center gap-0.5">
              <span>Audit</span> <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* 3. Tender Win Rate */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Tender Win-to-Bid</span>
            <span className="text-[11px] font-semibold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">
              Competitive
            </span>
          </div>
          <div className="my-1.5">
            <p className="text-xl font-extrabold text-sky-600 tracking-tight">
              {portfolioMetrics.tenderWinRate}%
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{quotes.length} total tenders registered</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Won & Projects</span>
            <button onClick={() => onNavigate('history')} className="text-orange-600 font-semibold hover:underline flex items-center gap-0.5">
              <span>Register</span> <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* 4. Net Liquid Working Capital */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Liquid Collections</span>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              76% Ratio
            </span>
          </div>
          <div className="my-1.5">
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">
              {currency} {formatMillions(portfolioMetrics.totalCollected)}M
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Total liquid settlement receipts</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Dues: {currency} {formatMillions(portfolioMetrics.accountsReceivable)}M</span>
            <button onClick={() => onNavigate('accounting')} className="text-orange-600 font-semibold hover:underline flex items-center gap-0.5">
              <span>Ledgers</span> <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* 5. Enterprise Risk Score */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Enterprise Risk Score</span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              Low Risk
            </span>
          </div>
          <div className="my-1.5">
            <div className="flex items-baseline gap-1">
              <p className="text-xl font-extrabold text-slate-900 tracking-tight">{portfolioMetrics.calculatedRiskScore}</p>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">HSE, Quality Hold-points & AR</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>0 Fatalities · SLS 1283</span>
            <button onClick={() => onNavigate('quality-control')} className="text-orange-600 font-semibold hover:underline flex items-center gap-0.5">
              <span>Audits</span> <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Visual Trajectory & Diversification Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Executive Growth Horizon Area Chart */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-orange-500" />
                <h3 className="text-sm font-bold text-slate-900">Pipeline, Contracts Awarded & Liquid Cash Inflow</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Quarterly trajectory in Millions {currency} comparing bidded tenders vs awarded backlogs vs actual bank inflows.</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-orange-400"></span>
                <span>Bids</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span>
                <span>Awarded</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                <span>Collections</span>
              </div>
            </div>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={executiveHorizonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="execBids" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb923c" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="execAwarded" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="execCash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `${val}M`} axisLine={{ stroke: '#cbd5e1' }} />
                <Tooltip 
                  formatter={(val: any) => [`LKR ${val} Million`, '']}
                  contentStyle={{ borderRadius: '12px', fontSize: '11px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="pipelineBids" name="Pipeline Bids" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#execBids)" />
                <Area type="monotone" dataKey="awardedContracts" name="Awarded Backlog" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#execAwarded)" />
                <Area type="monotone" dataKey="cashCollected" name="Cash Collections" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#execCash)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Portfolio Sector Diversification Donut */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900">Portfolio Sector Distribution</h3>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">Q3 Share</span>
            </div>
            <p className="text-xs text-slate-500">Revenue split across architecture verticals</p>
          </div>

          <div className="relative h-[180px] flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorDiversification}
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {sectorDiversification.map((entry, index) => (
                    <Cell key={`exec-pie-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] text-slate-400">Total Backlog</span>
              <span className="text-base font-extrabold text-slate-900">100%</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {sectorDiversification.map(s => (
              <div key={s.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-700 font-medium truncate max-w-[180px]">{s.name}</span>
                </div>
                <span className="font-bold text-slate-900">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Executive Decision Queue & C-Suite Governance */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></div>
              <h3 className="text-sm font-bold text-slate-900">Executive Decision & Sign-off Queue</h3>
              <span className="text-[10px] font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                {decisions.filter(d => d.status === 'Pending').length} Pending Board Action
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">High-impact governance items requiring C-Suite signature or commercial policy authorization.</p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => onNavigate('variation-manager')}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
            >
              Variations Manager
            </button>
            <button 
              onClick={() => onNavigate('verification')}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center gap-1"
            >
              <ShieldCheck size={13} className="text-emerald-600" />
              SVC Verification
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 mt-2">
          {decisions.map(item => {
            const isPending = item.status === 'Pending';
            return (
              <div key={item.id} className="py-3.5 first:pt-2 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                    item.type === 'VARIATION_APPROVAL' ? "bg-orange-100 text-orange-700" :
                    item.type === 'MATERIAL_HEDGE' ? "bg-blue-100 text-blue-700" :
                    item.type === 'CREDIT_EXPOSURE' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                  )}>
                    {item.type === 'VARIATION_APPROVAL' ? <SlidersHorizontal size={17} /> :
                     item.type === 'MATERIAL_HEDGE' ? <Flame size={17} /> :
                     item.type === 'CREDIT_EXPOSURE' ? <DollarSign size={17} /> : <ShieldCheck size={17} />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">{item.title}</h4>
                      <span className={cn(
                        "text-[10px] font-semibold px-2 py-0.2 rounded-md border",
                        item.status === 'Approved' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        item.status === 'Delegated' ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-orange-50 text-orange-700 border-orange-200"
                      )}>
                        {item.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">{item.description}</p>

                    <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1 flex-wrap">
                      <span className="font-semibold text-slate-700">{item.client}</span>
                      <span>•</span>
                      <span>{item.project}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-semibold">{item.marginImpact}</span>
                      <span>•</span>
                      <span className="text-rose-600 font-medium">{item.urgency}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                  <div className="text-right mr-2 hidden sm:block">
                    <span className="text-[10px] text-slate-400 block">Financial Scope</span>
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {currency} {item.impactValue.toLocaleString()}
                    </span>
                  </div>

                  {isPending ? (
                    <>
                      <button
                        onClick={() => handleDelegateDecision(item.id, item.title)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Delegate
                      </button>
                      <button
                        onClick={() => handleApproveDecision(item.id, item.title)}
                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1"
                      >
                        <CheckCircle2 size={13} />
                        <span>Sign & Approve</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      Resolved
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Key Account Portfolio Matrix & Executive Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tier-1 Strategic Client Accounts */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tier-1 Strategic Corporate Accounts</h3>
              <p className="text-xs text-slate-500">Commercial builders & architectural clients ranked by cumulative contract volume.</p>
            </div>
            <button 
              onClick={() => onNavigate('clients')}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <span>Client Directory</span>
              <ArrowUpRight size={13} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                  <th className="py-2">Client Enterprise</th>
                  <th className="py-2 text-center">Active Sites</th>
                  <th className="py-2 text-right">Contract Volume</th>
                  <th className="py-2 text-right">Realized Margin</th>
                  <th className="py-2 text-center">Credit Rating</th>
                  <th className="py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topKeyAccounts.map((account, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                        {account.name.charAt(0)}
                      </div>
                      <span className="truncate max-w-[180px]">{account.name}</span>
                    </td>
                    <td className="py-2.5 text-center text-slate-600 font-medium">
                      {account.projectsCount} {account.projectsCount === 1 ? 'Site' : 'Sites'}
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-900 font-mono">
                      {currency} {(account.contractValue / 1000000).toFixed(2)}M
                    </td>
                    <td className="py-2.5 text-right font-semibold text-emerald-600 font-mono">
                      {account.margin}
                    </td>
                    <td className="py-2.5 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        {account.paymentScore}
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      <button 
                        onClick={() => onNavigate('clients')}
                        className="p-1 text-slate-400 hover:text-slate-800 rounded hover:bg-slate-100 transition-colors"
                        title="View client profile"
                      >
                        <ExternalLink size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Executive Quick Command Matrix */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Executive Quick Command Hub</h3>
            <p className="text-xs text-slate-500 mt-0.5">One-click operational triggers for C-Suite audits and reporting.</p>
          </div>

          <div className="space-y-2 mt-4">
            <button
              onClick={() => onNavigate('post-evaluation')}
              className="w-full p-3 rounded-xl bg-orange-50/50 hover:bg-orange-50 border border-orange-100 text-left flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Scale size={16} className="text-orange-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Standard vs Actual Cost Audit</h4>
                  <p className="text-[10px] text-slate-500">Post-evaluation profit & loss analysis</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-400 group-hover:text-orange-600 transition-colors" />
            </button>

            <button
              onClick={() => onNavigate('reporting')}
              className="w-full p-3 rounded-xl bg-blue-50/50 hover:bg-blue-50 border border-blue-100 text-left flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <FileText size={16} className="text-blue-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Executive Financial Statements</h4>
                  <p className="text-[10px] text-slate-500">Aging debt, retentions & billing audit</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
            </button>

            <button
              onClick={() => onNavigate('verification')}
              className="w-full p-3 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 text-left flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={16} className="text-emerald-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Document Cryptographic Registry</h4>
                  <p className="text-[10px] text-slate-500">Tamper-proof SVC & barcode trust ledger</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-[11px] text-slate-400">
            <span>System Timestamp</span>
            <span className="font-mono text-slate-700">2026-09-23 UTC</span>
          </div>
        </div>
      </div>
    </div>
  );
};
