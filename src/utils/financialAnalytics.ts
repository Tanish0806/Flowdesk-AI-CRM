import { Deal, DealStage, Lead, FinancialTimeRange, LostReasonCategory } from '../types/crm';

export interface DateBoundary {
  start: Date;
  end: Date;
  label: string;
  prevLabel: string;
}

// Fixed simulated reference date representing "Today" in the Flowdesk CRM demo environment
export const SIMULATED_CRM_NOW = new Date('2026-10-13T12:00:00.000Z');

/**
 * Returns exact start/end date boundaries for the 5 specified financial time ranges,
 * along with the exact previous equivalent period for comparison.
 */
export function getFinancialDateBoundaries(
  range: FinancialTimeRange,
  refDate: Date = SIMULATED_CRM_NOW
): { current: DateBoundary; previous: DateBoundary } {
  const year = refDate.getUTCFullYear();
  const month = refDate.getUTCMonth(); // 0-indexed (9 = Oct)
  const date = refDate.getUTCDate(); // 13

  switch (range) {
    case 'today': {
      // Today: 2026-10-13 00:00:00 to 23:59:59.999
      const start = new Date(Date.UTC(year, month, date, 0, 0, 0, 0));
      const end = new Date(Date.UTC(year, month, date, 23, 59, 59, 999));

      // Previous: Yesterday (2026-10-12)
      const prevStart = new Date(Date.UTC(year, month, date - 1, 0, 0, 0, 0));
      const prevEnd = new Date(Date.UTC(year, month, date - 1, 23, 59, 59, 999));

      return {
        current: { start, end, label: 'Today (Oct 13, 2026)', prevLabel: 'vs. Yesterday' },
        previous: { start: prevStart, end: prevEnd, label: 'Yesterday (Oct 12, 2026)', prevLabel: '' },
      };
    }

    case '7d': {
      // Last 7 Days: today and previous six calendar days (Oct 7 - Oct 13)
      const start = new Date(Date.UTC(year, month, date - 6, 0, 0, 0, 0));
      const end = new Date(Date.UTC(year, month, date, 23, 59, 59, 999));

      // Previous equivalent 7 days (Sep 30 - Oct 6)
      const prevStart = new Date(Date.UTC(year, month, date - 13, 0, 0, 0, 0));
      const prevEnd = new Date(Date.UTC(year, month, date - 7, 23, 59, 59, 999));

      return {
        current: { start, end, label: 'Last 7 Days (Oct 7 – Oct 13)', prevLabel: 'vs. Prior 7 Days' },
        previous: { start: prevStart, end: prevEnd, label: 'Prior 7 Days (Sep 30 – Oct 6)', prevLabel: '' },
      };
    }

    case 'last_month': {
      // Last Month: previous complete calendar month (September 2026)
      const prevMonthIndex = month === 0 ? 11 : month - 1;
      const prevMonthYear = month === 0 ? year - 1 : year;
      const daysInPrevMonth = new Date(Date.UTC(prevMonthYear, prevMonthIndex + 1, 0)).getUTCDate();

      const start = new Date(Date.UTC(prevMonthYear, prevMonthIndex, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(prevMonthYear, prevMonthIndex, daysInPrevMonth, 23, 59, 59, 999));

      // Previous equivalent month (August 2026)
      const p2MonthIndex = prevMonthIndex === 0 ? 11 : prevMonthIndex - 1;
      const p2Year = prevMonthIndex === 0 ? prevMonthYear - 1 : prevMonthYear;
      const daysInP2 = new Date(Date.UTC(p2Year, p2MonthIndex + 1, 0)).getUTCDate();

      const prevStart = new Date(Date.UTC(p2Year, p2MonthIndex, 1, 0, 0, 0, 0));
      const prevEnd = new Date(Date.UTC(p2Year, p2MonthIndex, daysInP2, 23, 59, 59, 999));

      return {
        current: { start, end, label: 'Last Month (Sep 1 – Sep 30, 2026)', prevLabel: 'vs. August 2026' },
        previous: { start: prevStart, end: prevEnd, label: 'August 2026', prevLabel: '' },
      };
    }

    case 'last_6m': {
      // Last 6 complete calendar months (Apr 1 to Sep 30, 2026)
      const endMonthIndex = month === 0 ? 11 : month - 1; // 8 (Sep)
      const endYear = month === 0 ? year - 1 : year;
      const daysInEndMonth = new Date(Date.UTC(endYear, endMonthIndex + 1, 0)).getUTCDate();

      const startMonthIndex = (endMonthIndex - 5 + 12) % 12; // 3 (Apr)
      const startYear = endMonthIndex < 5 ? endYear - 1 : endYear;

      const start = new Date(Date.UTC(startYear, startMonthIndex, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(endYear, endMonthIndex, daysInEndMonth, 23, 59, 59, 999));

      // Previous 6 months (Oct 1, 2025 to Mar 31, 2026)
      const prevEndMonthIndex = (startMonthIndex - 1 + 12) % 12; // 2 (Mar)
      const prevEndYear = startMonthIndex === 0 ? startYear - 1 : startYear;
      const daysInPrevEnd = new Date(Date.UTC(prevEndYear, prevEndMonthIndex + 1, 0)).getUTCDate();

      const prevStartMonthIndex = (prevEndMonthIndex - 5 + 12) % 12; // 9 (Oct)
      const prevStartYear = prevEndMonthIndex < 5 ? prevEndYear - 1 : prevEndYear;

      const prevStart = new Date(Date.UTC(prevStartYear, prevStartMonthIndex, 1, 0, 0, 0, 0));
      const prevEnd = new Date(Date.UTC(prevEndYear, prevEndMonthIndex, daysInPrevEnd, 23, 59, 59, 999));

      return {
        current: { start, end, label: 'Last 6 Months (Apr 1 – Sep 30, 2026)', prevLabel: 'vs. Prior 6 Months' },
        previous: { start: prevStart, end: prevEnd, label: 'Prior 6 Months (Oct 2025 – Mar 2026)', prevLabel: '' },
      };
    }

    case 'last_year': {
      // Last Year: previous complete calendar year (2025)
      const start = new Date(Date.UTC(year - 1, 0, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(year - 1, 11, 31, 23, 59, 59, 999));

      // Previous equivalent year (2024)
      const prevStart = new Date(Date.UTC(year - 2, 0, 1, 0, 0, 0, 0));
      const prevEnd = new Date(Date.UTC(year - 2, 11, 31, 23, 59, 59, 999));

      return {
        current: { start, end, label: 'Last Year (Full Year 2025)', prevLabel: 'vs. FY 2024' },
        previous: { start: prevStart, end: prevEnd, label: 'Full Year 2024', prevLabel: '' },
      };
    }
  }
}

/**
 * Resolves the valid close date timestamp for a deal.
 */
export function getDealCloseTimestamp(deal: Deal): number | null {
  const dateStr = deal.actualCloseDate || deal.expectedCloseDate || deal.lastActivityAt || deal.createdAt;
  if (!dateStr) return null;
  const time = new Date(dateStr).getTime();
  return isNaN(time) ? null : time;
}

/**
 * Filter won deals within the specified date boundary.
 */
export function getWonDealsInPeriod(deals: Deal[], boundary: DateBoundary): Deal[] {
  const startMs = boundary.start.getTime();
  const endMs = boundary.end.getTime();

  return deals.filter((deal) => {
    if (deal.stage !== 'won') return false;
    const closeTime = getDealCloseTimestamp(deal);
    if (closeTime === null) return false;
    return closeTime >= startMs && closeTime <= endMs;
  });
}

export interface FinancialSummaryMetrics {
  revenue: number;
  recordedCosts: number;
  hasRecordedCosts: boolean;
  illustrativeCosts: number;
  useIllustrativeCosts: boolean;
  effectiveCosts: number | null;
  profit: number | null;
  profitMargin: number | null;
  wonDealsCount: number;
  periodLabel: string;
  prevPeriodLabel: string;
  prevRevenue: number;
  prevProfit: number | null;
  revenueGrowth: number | null;
  profitGrowth: number | null;
}

/**
 * Calculates Card A, B, C, D financial metrics for a selected period.
 */
export function calculateFinancialSummary(
  deals: Deal[],
  range: FinancialTimeRange,
  options: {
    useIllustrativeCosts?: boolean;
    illustrativeCostRate?: number; // e.g. 0.35 (35%)
  } = {}
): FinancialSummaryMetrics {
  const { current, previous } = getFinancialDateBoundaries(range);
  const useIllustrative = options.useIllustrativeCosts ?? false;
  const costRate = options.illustrativeCostRate ?? 0.35;

  // Current period won deals
  const currentWon = getWonDealsInPeriod(deals, current);
  const revenue = currentWon.reduce((sum, d) => sum + d.value, 0);

  // Recorded costs: sum of deals with explicit d.cost > 0
  const dealsWithCost = currentWon.filter((d) => typeof d.cost === 'number' && d.cost >= 0);
  const hasRecordedCosts = dealsWithCost.length > 0;
  const recordedCosts = dealsWithCost.reduce((sum, d) => sum + (d.cost || 0), 0);

  // Illustrative cost model for demo estimation
  const illustrativeCosts = Math.round(revenue * costRate);

  let effectiveCosts: number | null = null;
  let profit: number | null = null;
  let profitMargin: number | null = null;

  if (useIllustrative) {
    effectiveCosts = illustrativeCosts;
    profit = revenue - illustrativeCosts;
    profitMargin = revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : null;
  } else if (hasRecordedCosts) {
    effectiveCosts = recordedCosts;
    profit = revenue - recordedCosts;
    profitMargin = revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : null;
  } else {
    effectiveCosts = null;
    profit = null;
    profitMargin = null;
  }

  // Previous period metrics for genuine comparisons
  const prevWon = getWonDealsInPeriod(deals, previous);
  const prevRevenue = prevWon.reduce((sum, d) => sum + d.value, 0);

  let prevProfit: number | null = null;
  if (useIllustrative) {
    prevProfit = prevRevenue - Math.round(prevRevenue * costRate);
  } else {
    const prevWithCost = prevWon.filter((d) => typeof d.cost === 'number');
    if (prevWithCost.length > 0) {
      const prevRecordedCost = prevWithCost.reduce((s, d) => s + (d.cost || 0), 0);
      prevProfit = prevRevenue - prevRecordedCost;
    }
  }

  // Calculate percentage growth only when previous value > 0 to avoid false indicators
  let revenueGrowth: number | null = null;
  if (prevRevenue > 0) {
    revenueGrowth = Math.round(((revenue - prevRevenue) / prevRevenue) * 1000) / 10;
  }

  let profitGrowth: number | null = null;
  if (profit !== null && prevProfit !== null && prevProfit !== 0) {
    profitGrowth = Math.round(((profit - prevProfit) / Math.abs(prevProfit)) * 1000) / 10;
  }

  return {
    revenue,
    recordedCosts,
    hasRecordedCosts,
    illustrativeCosts,
    useIllustrativeCosts: useIllustrative,
    effectiveCosts,
    profit,
    profitMargin,
    wonDealsCount: currentWon.length,
    periodLabel: current.label,
    prevPeriodLabel: current.prevLabel,
    prevRevenue,
    prevProfit,
    revenueGrowth,
    profitGrowth,
  };
}

export interface TrendDataPoint {
  label: string;
  fullDate: string;
  revenue: number;
  costs: number | null;
  profit: number | null;
  wonCount: number;
  deals: Deal[];
}

/**
 * Generates the intervals and data points for the Profit Trend Chart.
 */
export function generateProfitTrendData(
  deals: Deal[],
  range: FinancialTimeRange,
  options: {
    useIllustrativeCosts?: boolean;
    illustrativeCostRate?: number;
  } = {}
): TrendDataPoint[] {
  const { current } = getFinancialDateBoundaries(range);
  const wonDeals = getWonDealsInPeriod(deals, current);
  const useIllustrative = options.useIllustrativeCosts ?? false;
  const costRate = options.illustrativeCostRate ?? 0.35;

  const calculateBucketValues = (bucketDeals: Deal[]) => {
    const rev = bucketDeals.reduce((sum, d) => sum + d.value, 0);
    let costs: number | null = null;
    let profit: number | null = null;

    if (useIllustrative) {
      costs = Math.round(rev * costRate);
      profit = rev - costs;
    } else {
      const withCosts = bucketDeals.filter((d) => typeof d.cost === 'number');
      if (withCosts.length > 0) {
        costs = withCosts.reduce((s, d) => s + (d.cost || 0), 0);
        profit = rev - costs;
      }
    }

    return { rev, costs, profit };
  };

  if (range === 'today') {
    // Hourly intervals across the business day
    const hours = [8, 10, 12, 14, 16, 18, 20];
    return hours.map((h) => {
      const hStr = `${String(h).padStart(2, '0')}:00`;
      const bucketDeals = wonDeals.filter((d) => {
        const time = getDealCloseTimestamp(d);
        if (!time) return false;
        const dealHour = new Date(time).getUTCHours();
        return dealHour >= h && dealHour < h + 2;
      });

      const { rev, costs, profit } = calculateBucketValues(bucketDeals);
      return {
        label: `${hStr} UTC`,
        fullDate: `Oct 13, 2026 ${hStr}`,
        revenue: rev,
        costs,
        profit,
        wonCount: bucketDeals.length,
        deals: bucketDeals,
      };
    });
  }

  if (range === '7d') {
    // 7 daily intervals: Oct 7 to Oct 13
    const days: TrendDataPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.UTC(2026, 9, 13 - i));
      const isoPrefix = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

      const bucketDeals = wonDeals.filter((deal) => {
        const t = getDealCloseTimestamp(deal);
        if (!t) return false;
        return new Date(t).toISOString().slice(0, 10) === isoPrefix;
      });

      const { rev, costs, profit } = calculateBucketValues(bucketDeals);
      days.push({
        label,
        fullDate: isoPrefix,
        revenue: rev,
        costs,
        profit,
        wonCount: bucketDeals.length,
        deals: bucketDeals,
      });
    }
    return days;
  }

  if (range === 'last_month') {
    // 5-day intervals across September (Sep 01-05, 06-10, 11-15, 16-20, 21-25, 26-30)
    const blocks = [
      { start: 1, end: 5, label: 'Sep 1–5' },
      { start: 6, end: 10, label: 'Sep 6–10' },
      { start: 11, end: 15, label: 'Sep 11–15' },
      { start: 16, end: 20, label: 'Sep 16–20' },
      { start: 21, end: 25, label: 'Sep 21–25' },
      { start: 26, end: 30, label: 'Sep 26–30' },
    ];

    return blocks.map((b) => {
      const bucketDeals = wonDeals.filter((deal) => {
        const t = getDealCloseTimestamp(deal);
        if (!t) return false;
        const dObj = new Date(t);
        const day = dObj.getUTCDate();
        const mon = dObj.getUTCMonth();
        return mon === 8 && day >= b.start && day <= b.end;
      });

      const { rev, costs, profit } = calculateBucketValues(bucketDeals);
      return {
        label: b.label,
        fullDate: `September ${b.start}–${b.end}, 2026`,
        revenue: rev,
        costs,
        profit,
        wonCount: bucketDeals.length,
        deals: bucketDeals,
      };
    });
  }

  if (range === 'last_6m') {
    // 6 monthly intervals: Apr, May, Jun, Jul, Aug, Sep 2026
    const months = [
      { m: 3, label: 'Apr 2026' },
      { m: 4, label: 'May 2026' },
      { m: 5, label: 'Jun 2026' },
      { m: 6, label: 'Jul 2026' },
      { m: 7, label: 'Aug 2026' },
      { m: 8, label: 'Sep 2026' },
    ];

    return months.map((mObj) => {
      const bucketDeals = wonDeals.filter((deal) => {
        const t = getDealCloseTimestamp(deal);
        if (!t) return false;
        const dObj = new Date(t);
        return dObj.getUTCFullYear() === 2026 && dObj.getUTCMonth() === mObj.m;
      });

      const { rev, costs, profit } = calculateBucketValues(bucketDeals);
      return {
        label: mObj.label,
        fullDate: mObj.label,
        revenue: rev,
        costs,
        profit,
        wonCount: bucketDeals.length,
        deals: bucketDeals,
      };
    });
  }

  // range === 'last_year' (2025 Jan to Dec)
  const allMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  return allMonths.map((mName, mIdx) => {
    const bucketDeals = wonDeals.filter((deal) => {
      const t = getDealCloseTimestamp(deal);
      if (!t) return false;
      const dObj = new Date(t);
      return dObj.getUTCFullYear() === 2025 && dObj.getUTCMonth() === mIdx;
    });

    const { rev, costs, profit } = calculateBucketValues(bucketDeals);
    return {
      label: mName,
      fullDate: `${mName} 2025`,
      revenue: rev,
      costs,
      profit,
      wonCount: bucketDeals.length,
      deals: bucketDeals,
    };
  });
}

export interface PipelineDonutSegment {
  stage: DealStage;
  label: string;
  count: number;
  value: number;
  percentage: number;
  color: string;
  deals: Deal[];
}

export const STAGE_COLOR_MAP: Record<DealStage, { label: string; color: string }> = {
  new: { label: 'New Opportunity', color: '#64748B' }, // slate-500
  qualified: { label: 'Qualified', color: '#3B82F6' }, // blue-500
  discovery: { label: 'Discovery', color: '#06B6D4' }, // cyan-500
  proposal: { label: 'Proposal', color: '#F59E0B' }, // amber-500
  negotiation: { label: 'Negotiation', color: '#0D9488' }, // teal-600
  won: { label: 'Closed Won', color: '#10B981' }, // emerald-500
  lost: { label: 'Closed Lost', color: '#F43F5E' }, // rose-500
};

/**
 * Calculates the Sales Pipeline Donut Chart distribution by Count or by Value.
 */
export function calculatePipelineDistribution(
  deals: Deal[],
  metric: 'count' | 'value' = 'count'
): {
  segments: PipelineDonutSegment[];
  totalDeals: number;
  totalValue: number;
} {
  const activeDeals = deals; // includes all stages
  const totalDeals = activeDeals.length;
  const totalValue = activeDeals.reduce((sum, d) => sum + d.value, 0);

  const stageKeys: DealStage[] = ['new', 'qualified', 'discovery', 'proposal', 'negotiation', 'won', 'lost'];

  const segments: PipelineDonutSegment[] = stageKeys.map((stage) => {
    const stageDeals = activeDeals.filter((d) => d.stage === stage);
    const count = stageDeals.length;
    const value = stageDeals.reduce((sum, d) => sum + d.value, 0);

    let percentage = 0;
    if (metric === 'count' && totalDeals > 0) {
      percentage = Math.round((count / totalDeals) * 1000) / 10;
    } else if (metric === 'value' && totalValue > 0) {
      percentage = Math.round((value / totalValue) * 1000) / 10;
    }

    return {
      stage,
      label: STAGE_COLOR_MAP[stage].label,
      count,
      value,
      percentage,
      color: STAGE_COLOR_MAP[stage].color,
      deals: stageDeals,
    };
  });

  return { segments, totalDeals, totalValue };
}

export interface LossReasonDonutSegment {
  reason: string;
  category: LostReasonCategory | 'Unspecified';
  count: number;
  value: number;
  percentage: number;
  color: string;
  deals: Deal[];
}

export const LOSS_REASON_COLORS: Record<string, string> = {
  'Budget Constraints': '#E11D48', // rose-600
  'Price Too High': '#F97316', // orange-500
  'Feature Limitations': '#8B5CF6', // purple-500
  'Better Alternative Selected': '#0284C7', // sky-600
  'Lack of Urgency': '#64748B', // slate-500
  'Other': '#78716C', // stone-500
  'Unspecified': '#94A3B8', // slate-400
};

/**
 * Normalizes and categorizes deal loss reasons.
 */
export function normalizeLossReason(raw?: string): LostReasonCategory | 'Unspecified' {
  if (!raw || !raw.trim()) return 'Unspecified';
  const lower = raw.toLowerCase();
  if (lower.includes('budget') || lower.includes('frozen') || lower.includes('funding')) {
    return 'Budget Constraints';
  }
  if (lower.includes('feature') || lower.includes('limitation') || lower.includes('spec')) {
    return 'Feature Limitations';
  }
  if (lower.includes('price') || lower.includes('expensive') || lower.includes('cost')) {
    return 'Price Too High';
  }
  if (lower.includes('alternative') || lower.includes('competitor') || lower.includes('vendor')) {
    return 'Better Alternative Selected';
  }
  if (lower.includes('urgency') || lower.includes('delayed') || lower.includes('postpone')) {
    return 'Lack of Urgency';
  }
  return 'Other';
}

/**
 * Calculates the Deal Loss Reasons Donut Chart distribution.
 */
export function calculateLossReasonDistribution(deals: Deal[]): {
  segments: LossReasonDonutSegment[];
  totalLostDeals: number;
  totalLostValue: number;
} {
  const lostDeals = deals.filter((d) => d.stage === 'lost');
  const totalLostDeals = lostDeals.length;
  const totalLostValue = lostDeals.reduce((sum, d) => sum + d.value, 0);

  if (totalLostDeals === 0) {
    return { segments: [], totalLostDeals: 0, totalLostValue: 0 };
  }

  // Group lost deals by normalized category
  const categories: (LostReasonCategory | 'Unspecified')[] = [
    'Budget Constraints',
    'Feature Limitations',
    'Price Too High',
    'Better Alternative Selected',
    'Lack of Urgency',
    'Other',
    'Unspecified',
  ];

  const map = new Map<string, Deal[]>();
  categories.forEach((cat) => map.set(cat, []));

  lostDeals.forEach((deal) => {
    const cat = normalizeLossReason(deal.lostReason);
    const existing = map.get(cat) || [];
    existing.push(deal);
    map.set(cat, existing);
  });

  const segments: LossReasonDonutSegment[] = [];

  categories.forEach((cat) => {
    const catDeals = map.get(cat) || [];
    if (catDeals.length > 0) {
      const count = catDeals.length;
      const value = catDeals.reduce((sum, d) => sum + d.value, 0);
      const percentage = Math.round((count / totalLostDeals) * 1000) / 10;
      segments.push({
        reason: cat,
        category: cat,
        count,
        value,
        percentage,
        color: LOSS_REASON_COLORS[cat] || '#64748B',
        deals: catDeals,
      });
    }
  });

  return { segments, totalLostDeals, totalLostValue };
}

export interface FunnelStageMetric {
  id: string;
  name: string;
  count: number;
  value: number;
  conversionFromPrev: number | null; // percentage e.g. 80.0
  overallConversion: number; // percentage from top of funnel
  color: string;
  description: string;
}

/**
 * Calculates a cohort-consistent sales journey funnel.
 */
export function calculateSalesFunnel(leads: Lead[], deals: Deal[]): {
  stages: FunnelStageMetric[];
  totalFunnelLeads: number;
  overallLeadToWinRate: number | null;
} {
  // Top: Total leads ingested
  const totalLeads = leads.length;

  // Qualified leads: status is qualified, engaged, or converted
  const qualifiedLeads = leads.filter((l) => l.status === 'qualified' || l.status === 'engaged');
  const qualifiedCount = qualifiedLeads.length;

  // Opportunity deals reaching Discovery or beyond
  const discoveryDeals = deals.filter((d) => d.stage !== 'new');
  const discoveryCount = discoveryDeals.length;
  const discoveryVal = discoveryDeals.reduce((s, d) => s + d.value, 0);

  // Proposal or beyond
  const proposalDeals = deals.filter((d) => ['proposal', 'negotiation', 'won'].includes(d.stage));
  const proposalCount = proposalDeals.length;
  const proposalVal = proposalDeals.reduce((s, d) => s + d.value, 0);

  // Negotiation or beyond
  const negotiationDeals = deals.filter((d) => ['negotiation', 'won'].includes(d.stage));
  const negotiationCount = negotiationDeals.length;
  const negotiationVal = negotiationDeals.reduce((s, d) => s + d.value, 0);

  // Closed Won
  const wonDeals = deals.filter((d) => d.stage === 'won');
  const wonCount = wonDeals.length;
  const wonVal = wonDeals.reduce((s, d) => s + d.value, 0);

  const baseCount = Math.max(totalLeads, 1);

  const rawStages = [
    {
      id: 'leads',
      name: '1. New Leads',
      count: totalLeads,
      value: 0,
      color: '#06B6D4',
      description: 'Total prospective leads received across all inbound and outbound channels.',
    },
    {
      id: 'qualified',
      name: '2. Qualified Leads',
      count: qualifiedCount,
      value: 0,
      color: '#3B82F6',
      description: 'Leads meeting ICP thresholds, budget fit, and decision-maker validation.',
    },
    {
      id: 'discovery',
      name: '3. Discovery',
      count: discoveryCount,
      value: discoveryVal,
      color: '#6366F1',
      description: 'Active opportunities in technical and business requirements evaluation.',
    },
    {
      id: 'proposal',
      name: '4. Proposal',
      count: proposalCount,
      value: proposalVal,
      color: '#F59E0B',
      description: 'Formal commercial agreements and architecture proposals under consideration.',
    },
    {
      id: 'negotiation',
      name: '5. Negotiation',
      count: negotiationCount,
      value: negotiationVal,
      color: '#0D9488',
      description: 'Commercial redlines, legal review, and MSA procurement alignment.',
    },
    {
      id: 'won',
      name: '6. Closed Won',
      count: wonCount,
      value: wonVal,
      color: '#10B981',
      description: 'Executed enterprise contracts with recognized revenue.',
    },
  ];

  const stages: FunnelStageMetric[] = rawStages.map((stage, idx) => {
    let conversionFromPrev: number | null = null;
    if (idx > 0) {
      const prevCount = rawStages[idx - 1].count;
      conversionFromPrev = prevCount > 0 ? Math.round((stage.count / prevCount) * 1000) / 10 : null;
    }
    const overallConversion = Math.round((stage.count / baseCount) * 1000) / 10;

    return {
      ...stage,
      conversionFromPrev,
      overallConversion,
    };
  });

  const overallLeadToWinRate = totalLeads > 0 ? Math.round((wonCount / totalLeads) * 1000) / 10 : null;

  return {
    stages,
    totalFunnelLeads: totalLeads,
    overallLeadToWinRate,
  };
}
