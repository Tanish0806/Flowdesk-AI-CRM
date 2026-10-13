import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  HelpCircle,
  ExternalLink,
  Info,
  Calendar,
  X,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  Award,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Deal, DealStage, FinancialTimeRange } from '../../types/crm';
import {
  calculateFinancialSummary,
  generateProfitTrendData,
  calculatePipelineDistribution,
  calculateLossReasonDistribution,
  calculateSalesFunnel,
  TrendDataPoint,
  PipelineDonutSegment,
  LossReasonDonutSegment,
} from '../../utils/financialAnalytics';

interface SalesAnalyticsSectionProps {
  isReportsPage?: boolean;
}

export const SalesAnalyticsSection: React.FC<SalesAnalyticsSectionProps> = ({ isReportsPage = false }) => {
  const { deals, leads, setCurrentTab, setSelectedDealId } = useCRM();

  // 1. Time-Range Selector: Today, Last 7 Days, Last Month, Last 6 Months, Last Year
  const [selectedRange, setSelectedRange] = useState<FinancialTimeRange>('last_month');

  // Illustrative Cost Model Toggle (Configurable demo assumption, clearly marked)
  const [useIllustrativeCosts, setUseIllustrativeCosts] = useState(false);
  const illustrativeCostRate = 0.35; // 35% COGS assumption

  // Donut Toggle: Distribution by number of deals vs by deal value
  const [pipelineMetric, setPipelineMetric] = useState<'count' | 'value'>('count');

  // Interactive Hover States
  const [hoveredTrendPoint, setHoveredTrendPoint] = useState<TrendDataPoint | null>(null);
  const [hoveredPipelineStage, setHoveredPipelineStage] = useState<string | null>(null);
  const [hoveredLossReason, setHoveredLossReason] = useState<string | null>(null);

  // Inspector Modal for clicked segments
  const [inspectorModal, setInspectorModal] = useState<{
    title: string;
    subtitle: string;
    deals: Deal[];
  } | null>(null);

  // Funnel Explanatory Info Modal
  const [funnelInfoOpen, setFunnelInfoOpen] = useState(false);

  // 2. Compute Financial Summaries
  const financialSummary = useMemo(() => {
    return calculateFinancialSummary(deals, selectedRange, {
      useIllustrativeCosts,
      illustrativeCostRate,
    });
  }, [deals, selectedRange, useIllustrativeCosts]);

  // 3. Compute Profit Trend Chart Data
  const trendData = useMemo(() => {
    return generateProfitTrendData(deals, selectedRange, {
      useIllustrativeCosts,
      illustrativeCostRate,
    });
  }, [deals, selectedRange, useIllustrativeCosts]);

  // 4. Compute Pipeline Donut Data
  const pipelineDonut = useMemo(() => {
    return calculatePipelineDistribution(deals, pipelineMetric);
  }, [deals, pipelineMetric]);

  // 5. Compute Loss Reasons Donut Data
  const lossDonut = useMemo(() => {
    return calculateLossReasonDistribution(deals);
  }, [deals]);

  // 6. Compute Sales Funnel Data
  const funnel = useMemo(() => {
    return calculateSalesFunnel(leads, deals);
  }, [leads, deals]);

  // 7. Top Deals and Sales Reps in Selected Period
  const periodWonDeals = useMemo(() => {
    const won = trendData.flatMap((t) => t.deals);
    // Sort descending by deal value
    return [...won].sort((a, b) => b.value - a.value);
  }, [trendData]);

  const repPerformance = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number; wonCount: number; deals: Deal[] }>();
    periodWonDeals.forEach((d) => {
      const existing = map.get(d.owner) || { name: d.owner, revenue: 0, wonCount: 0, deals: [] };
      existing.revenue += d.value;
      existing.wonCount += 1;
      existing.deals.push(d);
      map.set(d.owner, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [periodWonDeals]);

  // Helper for currency formatting
  const fmt = (val: number) => `$${val.toLocaleString()}`;

  // Helper to open deal inspection from segment click
  const inspectDeals = (title: string, subtitle: string, dealList: Deal[]) => {
    setInspectorModal({ title, subtitle, deals: dealList });
  };

  return (
    <section className="space-y-6">
      {/* 1. Header & Financial Time-Range Selector */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 transition">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600">
                <DollarSign size={18} />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Sales Analytics & Profit Performance
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    Live CRM Data
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Closed-won revenue recognition, recorded delivery costs, margin analysis, and pipeline distribution.
                </p>
              </div>
            </div>
          </div>

          {/* Time-Range Segmented Control */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200/80 text-xs font-medium">
              {[
                { id: 'today', label: 'Today' },
                { id: '7d', label: 'Last 7 Days' },
                { id: 'last_month', label: 'Last Month' },
                { id: 'last_6m', label: 'Last 6 Months' },
                { id: 'last_year', label: 'Last Year' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedRange(tab.id as FinancialTimeRange)}
                  className={`px-3 py-1.5 rounded-md transition font-medium cursor-pointer ${
                    selectedRange === tab.id
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Illustrative Cost Assumption Toggle */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900 select-none">
                <input
                  type="checkbox"
                  checked={useIllustrativeCosts}
                  onChange={(e) => setUseIllustrativeCosts(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5 cursor-pointer"
                />
                <span className="text-[11px] font-medium">Illustrative 35% Cost Assumption</span>
              </label>
              <div
                className="group relative cursor-help text-slate-400 hover:text-slate-600"
                title="When enabled, estimates 35% COGS for deals lacking manual cost records. When disabled, calculates strictly recorded deal costs."
              >
                <HelpCircle size={13} />
              </div>
            </div>
          </div>
        </div>

        {/* Selected Period Active Boundary Label */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2 font-mono">
            <Calendar size={13} className="text-teal-600" />
            <span className="font-semibold text-slate-700">{financialSummary.periodLabel}</span>
            <span className="text-slate-400">·</span>
            <span>{financialSummary.wonDealsCount} contracts recognized</span>
          </div>

          {useIllustrativeCosts && (
            <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
              Demo Estimate: 35% illustrative delivery cost model applied
            </span>
          )}
        </div>
      </div>

      {/* 2. Profit and Revenue Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card A — Revenue */}
        <div
          onClick={() =>
            inspectDeals(
              `Recognized Revenue Deals (${financialSummary.periodLabel})`,
              `${financialSummary.wonDealsCount} deals closed won`,
              periodWonDeals
            )
          }
          className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-teal-500/50 hover:shadow-sm transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-600">
              Recognized Revenue
            </span>
            <span className="p-1 rounded bg-teal-50 text-teal-600 group-hover:scale-110 transition">
              <DollarSign size={14} />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {fmt(financialSummary.revenue)}
          </div>
          <div className="flex items-center justify-between text-[11px] mt-2.5 pt-2 border-t border-slate-100">
            <span className="text-slate-500">{financialSummary.wonDealsCount} Closed-Won Deals</span>
            {financialSummary.revenueGrowth !== null ? (
              <span
                className={`inline-flex items-center gap-0.5 font-mono font-medium ${
                  financialSummary.revenueGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {financialSummary.revenueGrowth >= 0 ? (
                  <TrendingUp size={12} />
                ) : (
                  <TrendingDown size={12} />
                )}
                {financialSummary.revenueGrowth >= 0 ? '+' : ''}
                {financialSummary.revenueGrowth}% {financialSummary.prevPeriodLabel}
              </span>
            ) : (
              <span className="text-slate-400 font-mono text-[10px]">No prior baseline</span>
            )}
          </div>
        </div>

        {/* Card B — Estimated / Recorded Costs */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-sm transition">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-600 flex items-center gap-1">
              {useIllustrativeCosts ? 'Estimated Costs' : 'Recorded Costs'}
            </span>
            <span className="p-1 rounded bg-slate-100 text-slate-600">
              <Layers size={14} />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {financialSummary.effectiveCosts !== null
              ? fmt(financialSummary.effectiveCosts)
              : financialSummary.revenue > 0
              ? 'Costs not recorded'
              : '$0'}
          </div>
          <div className="flex items-center justify-between text-[11px] mt-2.5 pt-2 border-t border-slate-100">
            <span className="text-slate-500">
              {useIllustrativeCosts
                ? 'Assumed 35% COGS'
                : financialSummary.hasRecordedCosts
                ? 'From verified deal records'
                : 'No cost entries logged'}
            </span>
            {financialSummary.hasRecordedCosts && !useIllustrativeCosts && (
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-medium border border-emerald-200">
                Verified
              </span>
            )}
          </div>
        </div>

        {/* Card C — Profit */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-teal-500/50 hover:shadow-sm transition">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-600">
              {useIllustrativeCosts ? 'Estimated Profit' : 'Calculated Profit'}
            </span>
            <span className="p-1 rounded bg-emerald-50 text-emerald-600">
              <TrendingUp size={14} />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {financialSummary.profit !== null
              ? fmt(financialSummary.profit)
              : financialSummary.revenue > 0
              ? 'Costs not recorded'
              : '$0'}
          </div>
          <div className="flex items-center justify-between text-[11px] mt-2.5 pt-2 border-t border-slate-100">
            <span className="text-slate-500">Revenue − Costs</span>
            {financialSummary.profitGrowth !== null ? (
              <span
                className={`inline-flex items-center gap-0.5 font-mono font-medium ${
                  financialSummary.profitGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {financialSummary.profitGrowth >= 0 ? '+' : ''}
                {financialSummary.profitGrowth}% {financialSummary.prevPeriodLabel}
              </span>
            ) : (
              <span className="text-slate-400 font-mono text-[10px]">
                {financialSummary.profit !== null ? 'Consistent period' : 'N/A'}
              </span>
            )}
          </div>
        </div>

        {/* Card D — Profit Margin */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-teal-500/50 hover:shadow-sm transition">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-600">
              Profit Margin
            </span>
            <span className="p-1 rounded bg-teal-50 text-teal-600">
              <Award size={14} />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {financialSummary.profitMargin !== null ? `${financialSummary.profitMargin}%` : 'N/A'}
          </div>
          <div className="flex items-center justify-between text-[11px] mt-2.5 pt-2 border-t border-slate-100">
            <span className="text-slate-500">
              {financialSummary.profitMargin !== null ? 'Margin on Closed-Won' : 'Undefined at $0 rev'}
            </span>
            {financialSummary.profitMargin !== null && (
              <span className="text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border border-teal-200">
                {financialSummary.profitMargin >= 60 ? 'Strong' : 'Healthy'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Profit Trend Chart */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 transition">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="font-bold text-slate-900 text-sm md:text-base tracking-tight flex items-center gap-2">
              Financial Trajectory & Profit Trends
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Interval timeline of recognized revenue, delivery costs, and net profit over {financialSummary.periodLabel}.
            </p>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-teal-600 inline-block" />
              <span className="text-slate-700">Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-slate-400 inline-block" />
              <span className="text-slate-700">Costs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-emerald-500 inline-block" />
              <span className="text-slate-700">Profit</span>
            </div>
          </div>
        </div>

        {/* SVG Line / Area Financial Chart */}
        {trendData.length > 0 && financialSummary.revenue > 0 ? (
          <div className="relative w-full">
            <div className="h-64 sm:h-72 w-full">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 800 240" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0D9488" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#0D9488" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                {[0, 60, 120, 180].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="800"
                    y2={y}
                    stroke="#E2E8F0"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                ))}

                {/* Calculate coordinates */}
                {(() => {
                  const maxVal = Math.max(
                    ...trendData.map((d) => Math.max(d.revenue, d.costs || 0, d.profit || 0)),
                    10000
                  );
                  const stepX = 800 / (trendData.length - 1 || 1);

                  const revPoints = trendData.map((d, i) => {
                    const x = i * stepX;
                    const y = 220 - (d.revenue / maxVal) * 190;
                    return { x, y, d };
                  });

                  const costPoints = trendData.map((d, i) => {
                    const x = i * stepX;
                    const y = d.costs !== null ? 220 - (d.costs / maxVal) * 190 : 220;
                    return { x, y, d };
                  });

                  const profitPoints = trendData.map((d, i) => {
                    const x = i * stepX;
                    const y = d.profit !== null ? 220 - (d.profit / maxVal) * 190 : 220;
                    return { x, y, d };
                  });

                  const revPathD = revPoints.reduce(
                    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
                    ''
                  );
                  const revAreaD = `${revPathD} L ${revPoints[revPoints.length - 1].x} 220 L ${revPoints[0].x} 220 Z`;

                  const profitPathD = profitPoints.reduce(
                    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
                    ''
                  );

                  const costPathD = costPoints.reduce(
                    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
                    ''
                  );

                  return (
                    <>
                      {/* Area Fill for Revenue */}
                      <path d={revAreaD} fill="url(#revenueGrad)" />

                      {/* Revenue Line */}
                      <path d={revPathD} fill="none" stroke="#0D9488" strokeWidth="2.5" />

                      {/* Costs Line (dashed) */}
                      <path d={costPathD} fill="none" stroke="#94A3B8" strokeWidth="2" strokeDasharray="3 3" />

                      {/* Profit Line */}
                      <path d={profitPathD} fill="none" stroke="#10B981" strokeWidth="2.5" />

                      {/* Interactive Point Markers */}
                      {revPoints.map((pt, i) => (
                        <g key={i}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={hoveredTrendPoint?.label === pt.d.label ? 6 : 4}
                            fill="#0D9488"
                            stroke="#FFFFFF"
                            strokeWidth="2"
                            className="cursor-pointer transition"
                            onMouseEnter={() => setHoveredTrendPoint(pt.d)}
                            onClick={() =>
                              pt.d.deals.length > 0 &&
                              inspectDeals(`Recognized Deals (${pt.d.label})`, pt.d.fullDate, pt.d.deals)
                            }
                          />
                          {profitPoints[i] && pt.d.profit !== null && (
                            <circle
                              cx={profitPoints[i].x}
                              cy={profitPoints[i].y}
                              r={hoveredTrendPoint?.label === pt.d.label ? 5 : 3.5}
                              fill="#10B981"
                              stroke="#FFFFFF"
                              strokeWidth="2"
                              className="cursor-pointer transition"
                              onMouseEnter={() => setHoveredTrendPoint(pt.d)}
                            />
                          )}
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono mt-2 px-1">
              {trendData.map((pt, i) => (
                <span
                  key={i}
                  className={`cursor-pointer transition hover:text-teal-600 ${
                    hoveredTrendPoint?.label === pt.label ? 'text-teal-700 font-bold underline' : ''
                  }`}
                  onMouseEnter={() => setHoveredTrendPoint(pt)}
                >
                  {pt.label}
                </span>
              ))}
            </div>

            {/* Interactive Tooltip Card */}
            {hoveredTrendPoint && (
              <div className="mt-3 p-3 bg-slate-900 text-white rounded-lg text-xs flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-teal-300 font-mono">{hoveredTrendPoint.fullDate}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-300">{hoveredTrendPoint.wonCount} won contracts</span>
                </div>
                <div className="flex items-center gap-4 font-mono text-[11px]">
                  <span>
                    Revenue: <strong className="text-teal-400">{fmt(hoveredTrendPoint.revenue)}</strong>
                  </span>
                  <span>
                    Costs:{' '}
                    <strong className="text-slate-300">
                      {hoveredTrendPoint.costs !== null ? fmt(hoveredTrendPoint.costs) : 'N/A'}
                    </strong>
                  </span>
                  <span>
                    Profit:{' '}
                    <strong className="text-emerald-400">
                      {hoveredTrendPoint.profit !== null ? fmt(hoveredTrendPoint.profit) : 'N/A'}
                    </strong>
                  </span>
                </div>
                {hoveredTrendPoint.deals.length > 0 && (
                  <button
                    onClick={() =>
                      inspectDeals(
                        `Deals in ${hoveredTrendPoint.label}`,
                        hoveredTrendPoint.fullDate,
                        hoveredTrendPoint.deals
                      )
                    }
                    className="text-teal-300 hover:text-white underline text-[11px] ml-auto cursor-pointer"
                  >
                    Inspect {hoveredTrendPoint.deals.length} deals →
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="py-14 text-center bg-slate-50/70 rounded-lg border border-dashed border-slate-200">
            <DollarSign size={28} className="mx-auto text-slate-300 mb-2" />
            <h4 className="text-xs font-semibold text-slate-700">No Recognized Revenue in this Period</h4>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1">
              There were no deals marked Closed Won with recorded close dates inside {financialSummary.periodLabel}. Select
              another timeframe to view financial trajectories.
            </p>
          </div>
        )}
      </div>

      {/* 4 & 5. Side-by-Side Donut Charts (Pipeline Distribution & Deal Loss Reasons) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart 1: Sales Pipeline Distribution */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                  <PieChartIcon size={16} className="text-teal-600" />
                  Sales Pipeline Distribution
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Deal distribution across active and resolved pipeline stages. Click any slice to inspect.
                </p>
              </div>

              {/* Metric Toggle: Count vs Value */}
              <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium border border-slate-200/80">
                <button
                  onClick={() => setPipelineMetric('count')}
                  className={`px-2.5 py-1 rounded-md text-[11px] transition cursor-pointer ${
                    pipelineMetric === 'count'
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  By Count
                </button>
                <button
                  onClick={() => setPipelineMetric('value')}
                  className={`px-2.5 py-1 rounded-md text-[11px] transition cursor-pointer ${
                    pipelineMetric === 'value'
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  By Value
                </button>
              </div>
            </div>

            {/* Donut SVG Rendering */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-3">
              <div className="relative h-48 w-48 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                  {/* Background Circle */}
                  <circle cx="80" cy="80" r="60" fill="transparent" stroke="#F1F5F9" strokeWidth="22" />

                  {/* Segments calculation */}
                  {(() => {
                    const circumference = 2 * Math.PI * 60; // ~376.99
                    let accumulatedPercent = 0;

                    return pipelineDonut.segments.map((seg) => {
                      if (seg.percentage <= 0) return null;
                      const strokeDasharray = `${(seg.percentage / 100) * circumference} ${circumference}`;
                      const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
                      accumulatedPercent += seg.percentage;

                      const isHovered = hoveredPipelineStage === seg.stage;

                      return (
                        <circle
                          key={seg.stage}
                          cx="80"
                          cy="80"
                          r="60"
                          fill="transparent"
                          stroke={seg.color}
                          strokeWidth={isHovered ? 26 : 22}
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="cursor-pointer transition-all duration-150"
                          onMouseEnter={() => setHoveredPipelineStage(seg.stage)}
                          onMouseLeave={() => setHoveredPipelineStage(null)}
                          onClick={() =>
                            inspectDeals(`Stage: ${seg.label}`, `${seg.count} deals · ${fmt(seg.value)}`, seg.deals)
                          }
                        />
                      );
                    });
                  })()}
                </svg>

                {/* Donut Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total</span>
                  <span className="text-base font-bold font-mono text-slate-900 leading-tight">
                    {pipelineMetric === 'count' ? `${pipelineDonut.totalDeals} Deals` : fmt(pipelineDonut.totalValue)}
                  </span>
                  <span className="text-[10px] text-teal-600 font-medium">All Stages</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="w-full space-y-1.5 text-xs max-h-56 overflow-y-auto pr-1">
                {pipelineDonut.segments.map((seg) => (
                  <div
                    key={seg.stage}
                    onMouseEnter={() => setHoveredPipelineStage(seg.stage)}
                    onMouseLeave={() => setHoveredPipelineStage(null)}
                    onClick={() =>
                      inspectDeals(`Stage: ${seg.label}`, `${seg.count} deals · ${fmt(seg.value)}`, seg.deals)
                    }
                    className={`flex items-center justify-between p-1.5 rounded-lg transition cursor-pointer group ${
                      hoveredPipelineStage === seg.stage ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                      <span className="text-slate-700 truncate text-[11px] group-hover:text-slate-900">
                        {seg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                      <span className="text-slate-900 font-medium">
                        {pipelineMetric === 'count' ? `${seg.count} deals` : fmt(seg.value)}
                      </span>
                      <span className="text-slate-400 font-normal w-11 text-right">{seg.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Click any stage segment to view records</span>
            <button
              onClick={() => setCurrentTab('pipeline')}
              className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 cursor-pointer"
            >
              Open Kanban <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* Donut Chart 2: Deal Loss Reasons */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                  <AlertCircle size={16} className="text-rose-600" />
                  Deal Loss Reasons Distribution
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Breakdown across {lossDonut.totalLostDeals} deals marked Closed Lost. Click any reason to audit.
                </p>
              </div>

              <span className="text-[11px] font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {fmt(lossDonut.totalLostValue)} Lost
              </span>
            </div>

            {/* Donut SVG Rendering */}
            {lossDonut.totalLostDeals > 0 ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-3">
                <div className="relative h-48 w-48 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="60" fill="transparent" stroke="#F1F5F9" strokeWidth="22" />

                    {(() => {
                      const circumference = 2 * Math.PI * 60;
                      let accumulatedPercent = 0;

                      return lossDonut.segments.map((seg) => {
                        if (seg.percentage <= 0) return null;
                        const strokeDasharray = `${(seg.percentage / 100) * circumference} ${circumference}`;
                        const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
                        accumulatedPercent += seg.percentage;

                        const isHovered = hoveredLossReason === seg.reason;

                        return (
                          <circle
                            key={seg.reason}
                            cx="80"
                            cy="80"
                            r="60"
                            fill="transparent"
                            stroke={seg.color}
                            strokeWidth={isHovered ? 26 : 22}
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            className="cursor-pointer transition-all duration-150"
                            onMouseEnter={() => setHoveredLossReason(seg.reason)}
                            onMouseLeave={() => setHoveredLossReason(null)}
                            onClick={() =>
                              inspectDeals(`Lost Reason: ${seg.reason}`, `${seg.count} deals · ${fmt(seg.value)}`, seg.deals)
                            }
                          />
                        );
                      });
                    })()}
                  </svg>

                  {/* Center Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Lost</span>
                    <span className="text-base font-bold font-mono text-slate-900 leading-tight">
                      {lossDonut.totalLostDeals} Deals
                    </span>
                    <span className="text-[10px] text-rose-600 font-medium">Recorded Reasons</span>
                  </div>
                </div>

                {/* Legend List */}
                <div className="w-full space-y-1.5 text-xs max-h-56 overflow-y-auto pr-1">
                  {lossDonut.segments.map((seg) => (
                    <div
                      key={seg.reason}
                      onMouseEnter={() => setHoveredLossReason(seg.reason)}
                      onMouseLeave={() => setHoveredLossReason(null)}
                      onClick={() =>
                        inspectDeals(`Lost Reason: ${seg.reason}`, `${seg.count} deals · ${fmt(seg.value)}`, seg.deals)
                      }
                      className={`flex items-center justify-between p-1.5 rounded-lg transition cursor-pointer group ${
                        hoveredLossReason === seg.reason ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                        <span className="text-slate-700 truncate text-[11px] group-hover:text-slate-900">
                          {seg.reason}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                        <span className="text-slate-900 font-medium">{seg.count} deals</span>
                        <span className="text-slate-400 font-normal w-11 text-right">{seg.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                No deals currently marked Closed Lost.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Filter lost deals by primary commercial cause</span>
            <span className="text-slate-500 font-mono text-[10px]">Actual recorded loss reasons only</span>
          </div>
        </div>
      </div>

      {/* 6. Sales Funnel and Conversion Metrics */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 transition">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="font-bold text-slate-900 text-sm md:text-base tracking-tight flex items-center gap-2">
              <Layers size={16} className="text-teal-600" />
              Sales Funnel & Stage Velocity
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cohort conversion progression from initial lead qualification to closed contract.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => setFunnelInfoOpen(true)}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <Info size={13} />
              <span>Conversion Methodology</span>
            </button>
            <span className="font-mono text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              {funnel.overallLeadToWinRate !== null ? `${funnel.overallLeadToWinRate}% Overall Win Rate` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Funnel Stage Visualization */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          {funnel.stages.map((stage, idx) => (
            <div
              key={stage.id}
              className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/60 hover:bg-slate-100/60 transition group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-800 truncate">{stage.name}</span>
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: stage.color }}
                  />
                </div>
                <div className="text-xl font-bold font-mono text-slate-900">{stage.count}</div>
                {stage.value > 0 && (
                  <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                    {fmt(stage.value)}
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px]">
                {idx > 0 && stage.conversionFromPrev !== null ? (
                  <div className="flex items-center justify-between text-slate-600 font-mono">
                    <span>From Prev:</span>
                    <strong className="text-teal-700 font-semibold">{stage.conversionFromPrev}%</strong>
                  </div>
                ) : (
                  <div className="text-slate-400 text-[10px]">Top of funnel</div>
                )}
                <div className="flex items-center justify-between text-slate-500 font-mono mt-0.5">
                  <span>Of Leads:</span>
                  <span>{stage.overallConversion}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Top-Performing Deals & Sales Representatives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top-Performing Closed Deals in Selected Period */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                <Award size={16} className="text-amber-500" />
                Top Recognized Contracts in Period
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Highest-value Closed Won opportunities recognized in {financialSummary.periodLabel}.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-600">
              {periodWonDeals.length} won deals
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {periodWonDeals.length > 0 ? (
              periodWonDeals.slice(0, 5).map((deal, i) => (
                <div
                  key={deal.id}
                  onClick={() => setSelectedDealId(deal.id)}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-teal-300 hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="text-xs font-mono font-bold text-slate-400 w-4 text-center shrink-0">
                      #{i + 1}
                    </span>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{deal.name}</h4>
                      <p className="text-[10px] text-slate-500 truncate">
                        {deal.companyName} · Owner: {deal.owner}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono">
                    <div className="text-xs font-bold text-teal-700">{fmt(deal.value)}</div>
                    <span className="text-[10px] text-slate-400">
                      {deal.actualCloseDate ? deal.actualCloseDate.slice(0, 10) : deal.expectedCloseDate}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No won contracts recognized in this period.
              </div>
            )}
          </div>
        </div>

        {/* Sales Representatives Leaderboard */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                <CheckCircle2 size={16} className="text-teal-600" />
                Account Executive Performance
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Revenue contribution and contract volume by representative for {financialSummary.periodLabel}.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {repPerformance.length > 0 ? (
              repPerformance.map((rep) => {
                const repShare =
                  financialSummary.revenue > 0
                    ? Math.round((rep.revenue / financialSummary.revenue) * 100)
                    : 0;

                return (
                  <div key={rep.name} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-900">{rep.name}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <strong className="text-teal-700">{fmt(rep.revenue)}</strong>
                        <span className="text-slate-400 text-[11px]">({rep.wonCount} won)</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-600 rounded-full" style={{ width: `${repShare}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No representative activity in this timeframe.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inspector Modal: Opens when user clicks any Donut segment or summary card */}
      {inspectorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm md:text-base">{inspectorModal.title}</h3>
                <p className="text-xs text-slate-500">{inspectorModal.subtitle}</p>
              </div>
              <button
                onClick={() => setInspectorModal(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {inspectorModal.deals.length > 0 ? (
                inspectorModal.deals.map((d) => (
                  <div
                    key={d.id}
                    className="p-3 rounded-lg border border-slate-200 hover:border-teal-400 hover:bg-slate-50/70 transition flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="overflow-hidden">
                      <div className="font-bold text-slate-900 truncate">{d.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {d.companyName} · Contact: {d.contactName} · Owner: {d.owner}
                      </div>
                      {d.lostReason && (
                        <div className="text-[10px] text-rose-600 font-medium mt-0.5">
                          Lost Reason: {d.lostReason}
                        </div>
                      )}
                      {d.cost !== undefined && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          Recorded Delivery Cost: {fmt(d.cost)}
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0 font-mono">
                      <div className="font-bold text-slate-900 text-sm">{fmt(d.value)}</div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Stage: {d.stage}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">No matching deals found.</div>
              )}
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">Total {inspectorModal.deals.length} records</span>
              <button
                onClick={() => {
                  setInspectorModal(null);
                  setCurrentTab('deals');
                }}
                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs shadow-2xs transition cursor-pointer flex items-center gap-1.5"
              >
                <span>View Full Deals Table</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Funnel Explanatory Info Modal */}
      {funnelInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg p-5 text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Funnel Conversion Methodology</h3>
              <button
                onClick={() => setFunnelInfoOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="py-3 space-y-2.5 text-slate-600 leading-relaxed text-[11px]">
              <p>
                <strong>Cohort Definitions:</strong> Rather than summing point-in-time snapshot counts, each stage
                measures the proportion of qualified relationships advancing through successive deal milestones:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-700">
                <li>
                  <strong>New Leads:</strong> Total prospective accounts received across all lead channels.
                </li>
                <li>
                  <strong>Qualified Leads:</strong> Leads verified against B2B criteria (MQL / SQL).
                </li>
                <li>
                  <strong>Discovery to Closed Won:</strong> Opportunities actively negotiating or executed into signed contracts.
                </li>
              </ul>
              <p className="text-slate-500 pt-1 border-t border-slate-100 font-mono text-[10px]">
                Overall Lead-to-Win Rate = (Closed Won Deals ÷ Total Ingested Leads) × 100
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setFunnelInfoOpen(false)}
                className="px-3.5 py-1.5 bg-slate-900 text-white font-semibold rounded-lg text-xs hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
