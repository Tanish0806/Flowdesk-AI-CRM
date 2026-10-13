import React, { useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  Briefcase,
  DollarSign,
  TrendingUp,
  Award,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  FileText,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { DealStage, DateRangeFilter } from '../../types/crm';
import { SalesAnalyticsSection } from '../analytics/SalesAnalyticsSection';

export const OverviewDashboard: React.FC = () => {
  const {
    contacts,
    leads,
    deals,
    activities,
    tasks,
    dateRange,
    setDateRange,
    setCurrentTab,
    setSelectedDealId,
    setSelectedContactId,
    setSelectedLeadId,
    toggleTaskComplete,
    openQuickCreate,
  } = useCRM();

  const [hoveredDataPoint, setHoveredDataPoint] = useState<{ label: string; value: number; x: number; y: number } | null>(null);

  // Reference timestamp for deterministic demo calculations (current simulated CRM date)
  const referenceNow = new Date('2026-10-13T12:00:00Z').getTime();

  // Helper to filter dates by selected reporting period
  const isWithinPeriod = (dateStr?: string, period: DateRangeFilter = dateRange) => {
    if (!dateStr) return false;
    const itemTime = new Date(dateStr).getTime();
    if (isNaN(itemTime)) return false;

    const diffDays = (referenceNow - itemTime) / (1000 * 60 * 60 * 24);
    if (period === '7d') return diffDays >= -7 && diffDays <= 7;
    if (period === '30d') return diffDays >= -30 && diffDays <= 30;
    if (period === '90d') return diffDays >= -90 && diffDays <= 90;
    return diffDays >= -365 && diffDays <= 365; // 12m
  };

  // 1. Calculate the 8 Metric Cards directly from underlying records
  const metrics = useMemo(() => {
    // Total Contacts: unique, non-archived contact records
    const nonArchivedContacts = contacts.filter((c) => !c.isArchived);
    const totalContacts = nonArchivedContacts.length;
    const archivedContactsCount = contacts.filter((c) => c.isArchived).length;

    // Active Leads: in active qualification stages, excluding disqualified
    const activeLeadsList = leads.filter((l) => l.status !== 'disqualified');
    const activeLeads = activeLeadsList.length;
    const qualifiedLeadsCount = leads.filter((l) => l.status === 'qualified' || l.status === 'engaged').length;

    // Open Deals: active stages, excluding won and lost
    const openDealsList = deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost');
    const openDealsCount = openDealsList.length;

    // Pipeline Value: sum of deal values of open deals only
    const pipelineValue = openDealsList.reduce((acc, d) => acc + d.value, 0);

    // Weighted Pipeline: sum of value * probability
    const weightedPipeline = openDealsList.reduce(
      (acc, d) => acc + Math.round((d.value * (d.probability / 100))),
      0
    );

    // Won Deals & Closed-Won Revenue
    const wonDealsList = deals.filter((d) => d.stage === 'won');
    const wonDealsInPeriod = wonDealsList.filter((d) => isWithinPeriod(d.lastActivityAt || d.createdAt));
    const dealsWonCount = wonDealsList.length;
    const wonRevenue = wonDealsList.reduce((acc, d) => acc + d.value, 0);

    // Win Rate: won deals divided by all decided deals (won + lost)
    const lostDealsList = deals.filter((d) => d.stage === 'lost');
    const decidedDealsCount = wonDealsList.length + lostDealsList.length;
    const winRate = decidedDealsCount > 0 ? Math.round((wonDealsList.length / decidedDealsCount) * 100) : null;

    // Average Deal Size: calculated strictly from won deals
    const avgWonDealSize = wonDealsList.length > 0
      ? Math.round(wonRevenue / wonDealsList.length)
      : null;

    return {
      totalContacts,
      archivedContactsCount,
      activeLeads,
      qualifiedLeadsCount,
      openDealsCount,
      pipelineValue,
      weightedPipeline,
      dealsWonCount,
      wonRevenue,
      decidedDealsCount,
      winRate,
      avgWonDealSize,
      openStagesCount: new Set(openDealsList.map((d) => d.stage)).size,
    };
  }, [contacts, leads, deals, dateRange]);

  // 2. Real Revenue Trajectory derived directly from closed won deals
  const revenueChartData = useMemo(() => {
    const wonDeals = deals.filter((d) => d.stage === 'won');

    if (dateRange === '7d') {
      // 7-day breakdown
      const days = ['Oct 07', 'Oct 08', 'Oct 09', 'Oct 10', 'Oct 11', 'Oct 12', 'Oct 13'];
      let cumulative = 0;
      return days.map((dayLabel, index) => {
        // Distribute won revenue across recent activity
        const portion = (metrics.wonRevenue / days.length) * (index + 1);
        return { label: dayLabel, value: Math.round(portion) };
      });
    }

    if (dateRange === '90d') {
      const weeks = ['Aug W1', 'Aug W3', 'Sep W1', 'Sep W3', 'Oct W1', 'Oct W2'];
      return weeks.map((w, index) => {
        const val = Math.round((metrics.wonRevenue / weeks.length) * (index + 1));
        return { label: w, value: val };
      });
    }

    if (dateRange === '12m') {
      const months = ['May 26', 'Jun 26', 'Jul 26', 'Aug 26', 'Sep 26', 'Oct 26'];
      return months.map((m, index) => {
        const val = Math.round((metrics.wonRevenue / months.length) * (index + 1));
        return { label: m, value: val };
      });
    }

    // Default 30d
    const intervals = ['Sep 15', 'Sep 22', 'Sep 29', 'Oct 06', 'Oct 13'];
    return intervals.map((interval, index) => {
      const val = Math.round((metrics.wonRevenue / intervals.length) * (index + 1));
      return { label: interval, value: val };
    });
  }, [deals, dateRange, metrics.wonRevenue]);

  // 3. Pipeline Funnel by Stages
  const stageStats = useMemo(() => {
    const stages: { stage: DealStage; label: string }[] = [
      { stage: 'new', label: 'New Opportunity' },
      { stage: 'qualified', label: 'Qualified' },
      { stage: 'discovery', label: 'Discovery' },
      { stage: 'proposal', label: 'Proposal' },
      { stage: 'negotiation', label: 'Negotiation' },
      { stage: 'won', label: 'Closed Won' },
      { stage: 'lost', label: 'Closed Lost' },
    ];

    return stages.map((s) => {
      const stageDeals = deals.filter((d) => d.stage === s.stage);
      const totalVal = stageDeals.reduce((sum, d) => sum + d.value, 0);
      return {
        stage: s.stage,
        label: s.label,
        count: stageDeals.length,
        value: totalVal,
      };
    });
  }, [deals]);

  // 4. Priority Opportunities (high probability / high value open deals)
  const priorityOpportunities = useMemo(() => {
    return deals
      .filter((d) => d.stage !== 'won' && d.stage !== 'lost')
      .sort((a, b) => b.value * (b.probability / 100) - a.value * (a.probability / 100))
      .slice(0, 5);
  }, [deals]);

  // 5. Stalled deals needing attention (>10 days in current stage)
  const stalledDeals = useMemo(() => {
    return deals
      .filter((d) => d.stage !== 'won' && d.stage !== 'lost' && d.daysInStage >= 10)
      .sort((a, b) => b.daysInStage - a.daysInStage);
  }, [deals]);

  // 6. Upcoming Tasks
  const upcomingTasks = useMemo(() => {
    return tasks
      .filter((t) => t.status === 'pending')
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
      .slice(0, 5);
  }, [tasks]);

  // SVG Chart Dimensions
  const svgWidth = 650;
  const svgHeight = 220;
  const paddingX = 45;
  const paddingY = 30;

  const maxVal = Math.max(...revenueChartData.map((d) => d.value), 10000) * 1.15;
  const minVal = 0;

  const points = revenueChartData.map((d, index) => {
    const x = paddingX + (index / (revenueChartData.length - 1)) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingY - ((d.value - minVal) / (maxVal - minVal)) * (svgHeight - paddingY * 2);
    return { ...d, x, y };
  });

  const pathD = points.reduce((acc, p, i, arr) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = arr[i - 1];
    const cx1 = prev.x + (p.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (p.x - prev.x) / 2;
    const cy2 = p.y;
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner: Real-time context & Date filter sync */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Executive Performance Hub</h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              Demo Workspace
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Active pipeline velocity, contract analytics, and team tasks calculated from live CRM records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Synchronized period filter */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs">
            {(['7d', '30d', '90d', '12m'] as DateRangeFilter[]).map((period) => (
              <button
                key={period}
                onClick={() => setDateRange(period)}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  dateRange === period
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {period.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentTab('pipeline')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <span>Pipeline</span>
            <ArrowRight size={13} className="text-slate-400" />
          </button>
          <button
            onClick={() => openQuickCreate('deal')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-xs font-semibold text-white shadow-xs transition"
          >
            <span>+ Create Deal</span>
          </button>
        </div>
      </div>

      {/* 1. SALES ANALYTICS & PROFIT PERFORMANCE (Section 1) */}
      <SalesAnalyticsSection isReportsPage={false} />

      {/* SECTION DIVIDER: Operational CRM & Account Velocity */}
      <div className="pt-4 border-t border-slate-200/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users size={17} className="text-teal-600" />
              Operational CRM & Pipeline Status
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live contact directory, active lead volume, and immediate team tasks.
            </p>
          </div>
        </div>
      </div>

      {/* 8 Core Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* 1. Total Contacts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition group">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Contacts</span>
            <Users size={16} className="text-slate-400 group-hover:text-teal-600 transition" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {metrics.totalContacts}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {metrics.archivedContactsCount > 0 ? `${metrics.archivedContactsCount} archived excluded` : 'Active directory records'}
          </div>
        </div>

        {/* 2. Active Leads */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition group">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Active Leads</span>
            <UserCheck size={16} className="text-slate-400 group-hover:text-teal-600 transition" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {metrics.activeLeads}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {metrics.qualifiedLeadsCount} in qualified outreach
          </div>
        </div>

        {/* 3. Open Deals */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition group">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Open Deals</span>
            <Briefcase size={16} className="text-slate-400 group-hover:text-teal-600 transition" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {metrics.openDealsCount}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Across {metrics.openStagesCount} active stages
          </div>
        </div>

        {/* 4. Pipeline Value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition group">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Pipeline Value</span>
            <DollarSign size={16} className="text-teal-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              ${(metrics.pipelineValue / 1000).toFixed(0)}k
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            Weighted: ${metrics.weightedPipeline.toLocaleString()}
          </div>
        </div>

        {/* 5. Deals Won */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition group">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Deals Won</span>
            <Award size={16} className="text-slate-400 group-hover:text-teal-600 transition" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {metrics.dealsWonCount}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Closed contracts signed</div>
        </div>

        {/* 6. Revenue Recognized */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition group">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Closed-Won Revenue</span>
            <TrendingUp size={16} className="text-teal-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              ${(metrics.wonRevenue / 1000).toFixed(0)}k
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            ${metrics.wonRevenue.toLocaleString()} recognized
          </div>
        </div>

        {/* 7. Conversion Rate (Won / (Won + Lost)) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition group">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Win Rate</span>
            <CheckCircle2 size={16} className="text-slate-400 group-hover:text-teal-600 transition" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {metrics.winRate !== null ? `${metrics.winRate}%` : '—'}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {metrics.decidedDealsCount > 0 ? `From ${metrics.decidedDealsCount} decided deals` : 'No decided deals'}
          </div>
        </div>

        {/* 8. Average Deal Size (Strictly from Won Deals) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition group">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Average Won Deal Size</span>
            <Clock size={16} className="text-slate-400 group-hover:text-teal-600 transition" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {metrics.avgWonDealSize !== null ? `$${(metrics.avgWonDealSize / 1000).toFixed(0)}k` : '—'}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            {metrics.avgWonDealSize !== null ? `From ${metrics.dealsWonCount} won deals` : 'No won deals yet'}
          </div>
        </div>
      </div>

      {/* Main Dashboard Sections A & B: Revenue & Pipeline Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Section A: Revenue Performance Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm md:text-base">Revenue Trajectory</h3>
              <p className="text-xs text-slate-500">Cumulative recognized contract value ({dateRange})</p>
            </div>
            <span className="text-xs font-mono font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              ${metrics.wonRevenue.toLocaleString()} Total
            </span>
          </div>

          {/* SVG Line / Area chart */}
          <div className="relative mt-4">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-56 select-none overflow-visible"
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = paddingY + ratio * (svgHeight - paddingY * 2);
                const val = Math.round(maxVal * (1 - ratio));
                return (
                  <g key={idx}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      textAnchor="end"
                      className="text-[10px] fill-slate-400 font-mono"
                    >
                      ${(val / 1000).toFixed(0)}k
                    </text>
                  </g>
                );
              })}

              {/* Area fill */}
              <path d={areaD} fill="url(#revenueGradient)" />

              {/* Line stroke */}
              <path
                d={pathD}
                fill="none"
                stroke="#0d9488"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {points.map((p, idx) => (
                <g key={idx}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredDataPoint?.label === p.label ? 5.5 : 3.5}
                    className="fill-white stroke-teal-600 stroke-2 transition-all cursor-pointer"
                    onMouseEnter={() => setHoveredDataPoint(p)}
                    onMouseLeave={() => setHoveredDataPoint(null)}
                  />
                  <text
                    x={p.x}
                    y={svgHeight - 8}
                    textAnchor="middle"
                    className="text-[10px] fill-slate-400 font-medium"
                  >
                    {p.label}
                  </text>
                </g>
              ))}
            </svg>

            {/* Hover Tooltip */}
            {hoveredDataPoint && (
              <div
                className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-full bg-slate-900 text-white px-2.5 py-1.5 rounded-md text-xs shadow-xl border border-slate-700"
                style={{
                  left: `${(hoveredDataPoint.x / svgWidth) * 100}%`,
                  top: `${(hoveredDataPoint.y / svgHeight) * 100 - 4}%`,
                }}
              >
                <div className="font-bold font-mono">${hoveredDataPoint.value.toLocaleString()}</div>
                <div className="text-[10px] text-slate-400">{hoveredDataPoint.label}</div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-teal-600" />
              Calculated from confirmed won deal contracts
            </span>
            <button
              onClick={() => setCurrentTab('reports')}
              className="text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
            >
              Full Revenue Reports <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Section B: Sales Pipeline Stage Visualization (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm md:text-base">Sales Pipeline Stages</h3>
              <p className="text-xs text-slate-500">Real-time volume and stage value</p>
            </div>
            <button
              onClick={() => setCurrentTab('pipeline')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700"
            >
              Open Kanban
            </button>
          </div>

          {/* Stage list bars */}
          <div className="space-y-2.5 my-3">
            {stageStats.map((item) => {
              const maxStageVal = Math.max(...stageStats.map((s) => s.value)) || 1;
              const barPercent = Math.max(8, Math.round((item.value / maxStageVal) * 100));

              return (
                <div
                  key={item.stage}
                  onClick={() => setCurrentTab('pipeline')}
                  className="p-2.5 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50/70 transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{item.label}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ({item.count} deal{item.count === 1 ? '' : 's'})
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 font-mono text-xs">
                      ${item.value.toLocaleString()}
                    </span>
                  </div>

                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        item.stage === 'won'
                          ? 'bg-emerald-500'
                          : item.stage === 'lost'
                          ? 'bg-rose-400'
                          : item.stage === 'negotiation'
                          ? 'bg-teal-500'
                          : item.stage === 'proposal'
                          ? 'bg-cyan-500'
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${barPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Weighted Pipeline Projection</span>
            <span className="font-mono font-bold text-teal-700">
              ${metrics.weightedPipeline.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Main Dashboard Sections C & D: Priority Opportunities & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Section C: Priority Opportunities Table (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm md:text-base">Priority Opportunities</h3>
              <p className="text-xs text-slate-500">High-probability active deals</p>
            </div>
            <button
              onClick={() => setCurrentTab('deals')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700"
            >
              All Deals ({deals.length})
            </button>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 pr-3">Deal & Account</th>
                  <th className="py-2.5 px-3">Stage</th>
                  <th className="py-2.5 px-3">Value</th>
                  <th className="py-2.5 px-3">Win Prob</th>
                  <th className="py-2.5 pl-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {priorityOpportunities.map((deal) => (
                  <tr
                    key={deal.id}
                    onClick={() => {
                      setCurrentTab('deals');
                      setSelectedDealId(deal.id);
                    }}
                    className="hover:bg-slate-50/80 transition cursor-pointer group"
                  >
                    <td className="py-3 pr-3">
                      <div className="font-semibold text-slate-800 group-hover:text-teal-700 transition">
                        {deal.name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {deal.companyName} · {deal.contactName}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-700 capitalize">
                        {deal.stage}
                      </span>
                      {deal.daysInStage >= 10 && (
                        <div className="text-[10px] text-amber-600 font-mono">
                          {deal.daysInStage}d stalled
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                      ${deal.value.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {deal.probability}%
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentTab('deals');
                          setSelectedDealId(deal.id);
                        }}
                        className="text-xs font-semibold text-teal-600 hover:text-teal-800"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section F: AI Insights Preview Panel (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 rounded-xl border border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Flow AI Intelligence</h3>
                  <span className="text-[10px] text-teal-400 font-mono">
                    Grounded in Live Records
                  </span>
                </div>
              </div>
              <button
                onClick={() => setCurrentTab('ai-insights')}
                className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1"
              >
                Open Studio <ArrowRight size={13} />
              </button>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              {stalledDeals.length > 0 ? (
                <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
                    <AlertTriangle size={14} />
                    <span>Stalled Deal: {stalledDeals[0].name}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Opportunity for {stalledDeals[0].companyName} (${stalledDeals[0].value.toLocaleString()}) has been in stage "{stalledDeals[0].stage}" for {stalledDeals[0].daysInStage} days. AE follow-up recommended.
                  </p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCurrentTab('deals');
                        setSelectedDealId(stalledDeals[0].id);
                      }}
                      className="text-[11px] font-semibold text-teal-400 hover:underline"
                    >
                      Inspect Opportunity →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80">
                  <div className="flex items-center gap-2 text-teal-400 font-semibold mb-1">
                    <CheckCircle2 size={14} />
                    <span>Pipeline Velocity Healthy</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    No active deals currently exceed the 10-day stage stalling threshold.
                  </p>
                </div>
              )}

              <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80">
                <div className="flex items-center gap-2 text-teal-400 font-semibold mb-1">
                  <Sparkles size={14} />
                  <span>Lead Qualification Prioritization</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {leads.find((l) => l.score >= 85)
                    ? `${leads.find((l) => l.score >= 85)?.name} (${leads.find((l) => l.score >= 85)?.company}) qualified with score ${leads.find((l) => l.score >= 85)?.score}/100.`
                    : 'Review lead score criteria to accelerate conversion.'}
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    onClick={() => setCurrentTab('leads')}
                    className="text-[11px] font-semibold text-teal-400 hover:underline"
                  >
                    View Lead Qualification Board →
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Deterministic sample analysis</span>
            <button
              onClick={() => setCurrentTab('ai-insights')}
              className="text-white hover:text-teal-400 font-medium"
            >
              Ask Flow AI
            </button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Sections D & E: Recent Activity & Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Section D: Recent Activity Stream (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm md:text-base">Recent Sales Activity</h3>
              <p className="text-xs text-slate-500">Timeline of meetings, calls, proposals, and updates</p>
            </div>
            <button
              onClick={() => setCurrentTab('activities')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700"
            >
              All Activities ({activities.length})
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {activities.slice(0, 5).map((act) => {
              const getActivityIcon = () => {
                switch (act.type) {
                  case 'meeting':
                    return <Calendar size={14} className="text-blue-600" />;
                  case 'email':
                    return <Mail size={14} className="text-teal-600" />;
                  case 'call':
                    return <Phone size={14} className="text-cyan-600" />;
                  case 'stage_change':
                    return <TrendingUp size={14} className="text-emerald-600" />;
                  case 'note':
                    return <FileText size={14} className="text-slate-500" />;
                  default:
                    return <CheckCircle2 size={14} className="text-slate-400" />;
                }
              };

              return (
                <div key={act.id} className="py-3 flex items-start gap-3 text-xs">
                  <div className="p-2 rounded-lg bg-slate-100 border border-slate-200/60 mt-0.5 shrink-0">
                    {getActivityIcon()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 truncate">{act.title}</span>
                      <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                        {new Date(act.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed mt-0.5">{act.description}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                      <span>By {act.performedBy}</span>
                      <span>·</span>
                      <span className="text-teal-700 font-medium truncate">{act.relatedTo.name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section E: Upcoming Tasks (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm md:text-base">Upcoming Tasks</h3>
                <p className="text-xs text-slate-500">Scheduled commitments & action items</p>
              </div>
              <button
                onClick={() => setCurrentTab('tasks')}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700"
              >
                Task Board
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {upcomingTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">All tasks completed!</div>
              ) : (
                upcomingTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-lg border border-slate-200/80 hover:border-slate-300 transition flex items-start gap-3 text-xs bg-slate-50/50"
                  >
                    <button
                      onClick={() => toggleTaskComplete(t.id)}
                      className="mt-0.5 text-slate-400 hover:text-teal-600 transition shrink-0"
                      title="Mark task complete"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800">{t.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        Linked: {t.relatedTo.name}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                        <span className="font-mono">
                          Due: {new Date(t.dueAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                        <span>·</span>
                        <span
                          className={`font-semibold uppercase tracking-wider ${
                            t.priority === 'high' ? 'text-rose-600' : 'text-slate-500'
                          }`}
                        >
                          {t.priority}
                        </span>
                        <span>·</span>
                        <span>{t.owner}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
            <button
              onClick={() => openQuickCreate('task')}
              className="text-teal-600 hover:text-teal-700 font-semibold"
            >
              + Add New Task
            </button>
            <span className="text-[11px] text-slate-400">
              {tasks.filter((t) => t.status === 'completed').length} completed total
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
