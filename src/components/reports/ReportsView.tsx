import React, { useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  Calendar,
  Filter,
  DollarSign,
  PieChart,
  Target,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Info,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { DateRangeFilter } from '../../types/crm';
import { SalesAnalyticsSection } from '../analytics/SalesAnalyticsSection';

export const ReportsView: React.FC = () => {
  const { contacts, leads, deals, tasks, dateRange, setDateRange } = useCRM();

  const referenceNow = new Date('2026-10-13T12:00:00Z').getTime();

  // Helper to filter items by selected reporting period
  const isWithinPeriod = (dateStr?: string) => {
    if (!dateStr) return true;
    const itemTime = new Date(dateStr).getTime();
    if (isNaN(itemTime)) return true;

    const diffDays = (referenceNow - itemTime) / (1000 * 60 * 60 * 24);
    if (dateRange === '7d') return diffDays >= -7 && diffDays <= 7;
    if (dateRange === '30d') return diffDays >= -30 && diffDays <= 30;
    if (dateRange === '90d') return diffDays >= -90 && diffDays <= 90;
    return true; // 12m
  };

  // Filtered collections based on period
  const filteredDeals = useMemo(() => {
    return deals.filter((d) => isWithinPeriod(d.lastActivityAt || d.createdAt));
  }, [deals, dateRange]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => isWithinPeriod(t.dueAt || t.createdAt));
  }, [tasks, dateRange]);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => isWithinPeriod(l.createdAt));
  }, [leads, dateRange]);

  // 1. Lead Source Breakdown
  const leadSourceStats = useMemo(() => {
    const sources = ['Inbound Website', 'Outbound SDR', 'Referral', 'Conference / Event', 'Product Signup', 'Partner Ecosystem'];
    return sources.map((source) => {
      const sourceLeads = filteredLeads.filter((l) => l.source === source);
      const qualifiedCount = sourceLeads.filter((l) => l.status === 'qualified' || l.status === 'engaged').length;
      const rate = sourceLeads.length > 0 ? Math.round((qualifiedCount / sourceLeads.length) * 100) : 0;
      return {
        source,
        total: sourceLeads.length,
        qualified: qualifiedCount,
        conversionRate: rate,
      };
    });
  }, [filteredLeads]);

  // 2. Sales Rep Leaderboard
  const repStats = useMemo(() => {
    const reps = ['Alex Morgan', 'Jordan Taylor', 'Elena Soto'];
    return reps.map((rep) => {
      const repDeals = filteredDeals.filter((d) => d.owner === rep);
      const wonDeals = repDeals.filter((d) => d.stage === 'won');
      const openDeals = repDeals.filter((d) => d.stage !== 'won' && d.stage !== 'lost');
      const totalWonRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
      const pipelineValue = openDeals.reduce((sum, d) => sum + d.value, 0);

      return {
        name: rep,
        wonRevenue: totalWonRevenue,
        openPipeline: pipelineValue,
        wonDealsCount: wonDeals.length,
        openDealsCount: openDeals.length,
      };
    });
  }, [filteredDeals]);

  // 3. Stage distribution
  const stageDistribution = useMemo(() => {
    const stages = [
      { id: 'new', label: 'New Opportunity' },
      { id: 'qualified', label: 'Qualified' },
      { id: 'discovery', label: 'Discovery' },
      { id: 'proposal', label: 'Proposal' },
      { id: 'negotiation', label: 'Negotiation' },
      { id: 'won', label: 'Closed Won' },
      { id: 'lost', label: 'Closed Lost' },
    ];
    return stages.map((st) => {
      const matching = filteredDeals.filter((d) => d.stage === st.id);
      const totalVal = matching.reduce((s, d) => s + d.value, 0);
      return {
        stage: st.label,
        count: matching.length,
        value: totalVal,
      };
    });
  }, [filteredDeals]);

  // 4. Lost Deal Reasons
  const lostReasons = useMemo(() => {
    const lostList = filteredDeals.filter((d) => d.stage === 'lost');
    const reasonsMap: Record<string, number> = {};
    lostList.forEach((d) => {
      const r = d.lostReason || 'Budget constraints';
      reasonsMap[r] = (reasonsMap[r] || 0) + 1;
    });

    if (lostList.length === 0) {
      return [{ reason: 'No deals marked lost in this timeframe', count: 0 }];
    }

    return Object.entries(reasonsMap).map(([reason, count]) => ({ reason, count }));
  }, [filteredDeals]);

  // 5. Funnel Conversion Metrics
  const totalLeadsCount = filteredLeads.length;
  const qualifiedLeadsCount = filteredLeads.filter((l) => l.status === 'qualified' || l.status === 'engaged').length;
  const openDealsCount = filteredDeals.filter((d) => d.stage !== 'won' && d.stage !== 'lost').length;
  const wonDealsCount = filteredDeals.filter((d) => d.stage === 'won').length;
  const lostDealsCount = filteredDeals.filter((d) => d.stage === 'lost').length;

  const decidedDealsCount = wonDealsCount + lostDealsCount;
  const oppToWinRate = decidedDealsCount > 0 ? Math.round((wonDealsCount / decidedDealsCount) * 100) : null;
  const leadToOppRate = totalLeadsCount > 0 ? Math.round((qualifiedLeadsCount / totalLeadsCount) * 100) : null;

  // Real Average Sales Cycle from decided deals (difference in days from createdAt to close)
  const averageSalesCycle = useMemo(() => {
    const decidedDeals = filteredDeals.filter((d) => d.stage === 'won' || d.stage === 'lost');
    if (decidedDeals.length === 0) return null;

    let totalDays = 0;
    let validCount = 0;

    decidedDeals.forEach((d) => {
      const created = new Date(d.createdAt).getTime();
      const closed = new Date(d.expectedCloseDate || d.lastActivityAt).getTime();
      if (!isNaN(created) && !isNaN(closed)) {
        const days = Math.max(1, Math.round(Math.abs(closed - created) / (1000 * 60 * 60 * 24)));
        totalDays += days;
        validCount++;
      }
    });

    return validCount > 0 ? Math.round(totalDays / validCount) : null;
  }, [filteredDeals]);

  const taskCompletionRate = filteredTasks.length > 0
    ? Math.round((filteredTasks.filter((t) => t.status === 'completed').length / filteredTasks.length) * 100)
    : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner with DEMO DATA Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Executive Reports & Analytics</h2>
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-800 border border-amber-400/30">
              DEMO DATA
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full-funnel conversion analysis, sales rep performance, and pipeline velocity.
          </p>
        </div>

        {/* Date Filter selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs">
          {(['7d', '30d', '90d', '12m'] as DateRangeFilter[]).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1 rounded-md font-medium transition ${
                dateRange === range
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* SALES ANALYTICS & PROFIT DASHBOARD */}
      <SalesAnalyticsSection isReportsPage={true} />

      {/* SECTION DIVIDER: Detailed Funnel & Rep Analytics */}
      <div className="pt-4 border-t border-slate-200/80">
        <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 mb-1">
          <BarChart3 size={17} className="text-teal-600" />
          CRM Funnel Health & Channel Retention
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Lead attribution breakdown, account executive quota pacing, and sales cycle efficiency.
        </p>
      </div>

      {/* Top KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Lead to Opp Conversion */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Lead to Opp Conversion</span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {leadToOppRate !== null ? `${leadToOppRate}%` : '—'}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {qualifiedLeadsCount} of {totalLeadsCount} leads qualified
          </span>
        </div>

        {/* Opportunity Win Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Opportunity Win Rate</span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {oppToWinRate !== null ? `${oppToWinRate}%` : '—'}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {decidedDealsCount > 0 ? `${wonDealsCount} won / ${decidedDealsCount} decided` : 'No decided deals'}
          </span>
        </div>

        {/* Average Sales Cycle */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Average Sales Cycle</span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {averageSalesCycle !== null ? `${averageSalesCycle} Days` : '—'}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {averageSalesCycle !== null ? 'Creation to close duration' : 'Insufficient closed deals'}
          </span>
        </div>

        {/* Task Completion Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Task Completion Rate</span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {taskCompletionRate !== null ? `${taskCompletionRate}%` : '—'}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {filteredTasks.filter((t) => t.status === 'completed').length} of {filteredTasks.length} tasks
          </span>
        </div>
      </div>

      {/* Conversion Funnel & Sales Rep Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Full Funnel Visualization (6 cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Full-Funnel Stage Conversion</h3>
            <p className="text-xs text-slate-500">Volume and retention from lead qualification to revenue</p>

            <div className="space-y-3 mt-5">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800">1. Raw Leads Ingested</span>
                  <div className="text-[11px] text-slate-400">Total qualified queue</div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900">{totalLeadsCount} Leads</span>
                  <div className="text-[10px] text-slate-400">100% cohort</div>
                </div>
              </div>

              <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-teal-900">2. Qualified Prospects</span>
                  <div className="text-[11px] text-teal-700">Qualified & engaged status</div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-teal-900">{qualifiedLeadsCount} Leads</span>
                  <div className="text-[10px] text-teal-700 font-semibold">{leadToOppRate ?? 0}% retention</div>
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-blue-900">3. Active Pipeline Deals</span>
                  <div className="text-[11px] text-blue-700">In evaluation or proposal</div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-blue-900">{openDealsCount} Deals</span>
                  <div className="text-[10px] text-blue-700 font-semibold">Open opportunities</div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-emerald-900">4. Closed Won Contracts</span>
                  <div className="text-[11px] text-emerald-700">Executed revenue</div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-emerald-900">{wonDealsCount} Deals</span>
                  <div className="text-[10px] text-emerald-700 font-semibold">{oppToWinRate ?? 0}% win rate</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Derived from current active CRM records</span>
            <span className="font-mono">{wonDealsCount} contracts won</span>
          </div>
        </div>

        {/* Rep Leaderboard (6 cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Account Executive Performance</h3>
            <p className="text-xs text-slate-500">Won revenue and open pipeline contribution by sales owner</p>

            <div className="divide-y divide-slate-100 mt-4 text-xs">
              {repStats.map((rep, idx) => (
                <div key={rep.name} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-full bg-slate-100 font-mono font-bold text-slate-600 flex items-center justify-center text-[11px]">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900">{rep.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {rep.wonDealsCount} won · {rep.openDealsCount} active
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-emerald-700">
                      ${rep.wonRevenue.toLocaleString()} won
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      ${rep.openPipeline.toLocaleString()} pipeline
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Quota pacing tracking enabled</span>
            <span className="text-teal-600 font-semibold">Active team coverage</span>
          </div>
        </div>
      </div>

      {/* Lead Source Breakdown Table & Deal Reasons */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lead Source Performance (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <h3 className="font-bold text-slate-900 text-sm">Lead Source Performance</h3>
          <p className="text-xs text-slate-500 mb-4">Channel volume and qualification conversion rates</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 pr-3">Channel Source</th>
                  <th className="py-2.5 px-3">Volume</th>
                  <th className="py-2.5 px-3">Qualified</th>
                  <th className="py-2.5 pl-3 text-right">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leadSourceStats.map((item) => (
                  <tr key={item.source} className="hover:bg-slate-50/70">
                    <td className="py-2.5 pr-3 font-semibold text-slate-800">{item.source}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{item.total}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{item.qualified}</td>
                    <td className="py-2.5 pl-3 text-right font-mono font-bold text-slate-900">
                      {item.conversionRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Closed Lost Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Closed Lost Deal Reasons</h3>
            <p className="text-xs text-slate-500 mb-4">Primary objections and attrition drivers</p>

            <div className="space-y-2.5 text-xs">
              {lostReasons.map((item) => (
                <div
                  key={item.reason}
                  className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/60 flex items-center justify-between"
                >
                  <span className="font-medium text-slate-700">{item.reason}</span>
                  <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {item.count} {item.count === 1 ? 'deal' : 'deals'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Recorded during deal loss confirmation workflow.
          </div>
        </div>
      </div>
    </div>
  );
};
