export type LifecycleStage = 'subscriber' | 'lead' | 'mql' | 'sql' | 'opportunity' | 'customer' | 'evangelist';

export type LeadSource = 'Inbound Website' | 'Outbound SDR' | 'Referral' | 'Conference / Event' | 'Partner Ecosystem' | 'Product Signup';

export type LeadStatus = 'new' | 'researching' | 'qualified' | 'contacted' | 'engaged' | 'disqualified';

export type DealStage = 'new' | 'qualified' | 'discovery' | 'proposal' | 'negotiation' | 'won' | 'lost';

export type ActivityType = 'email' | 'call' | 'meeting' | 'note' | 'task' | 'deal_update' | 'stage_change';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface ScoreBreakdown {
  companySize: number;
  titleMatch: number;
  productIntent: number;
  engagement: number;
  budgetFit: number;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  companyId: string;
  companyName: string;
  country: string;
  leadSource: LeadSource;
  lifecycleStage: LifecycleStage;
  owner: string;
  avatarUrl?: string;
  lastActivityAt: string;
  nextFollowUpAt?: string;
  notesCount: number;
  tags: string[];
  createdAt: string;
  isArchived?: boolean;
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  industry: string;
  size: string;
  employeeCount: number;
  location: string;
  openDealsCount: number;
  totalDealValue: number;
  contactsCount: number;
  lastInteractionAt: string;
  logoBg: string;
  about: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  source: LeadSource;
  country: string;
  industry: string;
  companySize: string;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  status: LeadStatus;
  owner: string;
  lastContactedAt: string;
  nextAction: string;
  notes?: string;
  createdAt: string;
}

export type LostReasonCategory =
  | 'Budget Constraints'
  | 'Feature Limitations'
  | 'Price Too High'
  | 'Better Alternative Selected'
  | 'Lack of Urgency'
  | 'Other';

export interface Deal {
  id: string;
  name: string;
  companyId: string;
  companyName: string;
  contactId: string;
  contactName: string;
  value: number;
  currency: string;
  stage: DealStage;
  probability: number;
  expectedCloseDate: string;
  actualCloseDate?: string;
  owner: string;
  daysInStage: number;
  priority: TaskPriority;
  lostReason?: string;
  cost?: number;
  costNotes?: string;
  notes?: string;
  createdAt: string;
  lastActivityAt: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  relatedTo: {
    type: 'contact' | 'company' | 'deal' | 'lead';
    id: string;
    name: string;
  };
  performedBy: string;
  timestamp: string;
  metadata?: Record<string, string | number>;
}

export interface Task {
  id: string;
  title: string;
  dueAt: string;
  priority: TaskPriority;
  owner: string;
  status: 'pending' | 'completed';
  relatedTo: {
    type: 'contact' | 'company' | 'deal' | 'lead';
    id: string;
    name: string;
  };
  createdAt: string;
  completedAt?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'meeting' | 'followup' | 'task' | 'call';
  relatedName: string;
  attendees?: string[];
  notes?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'deal' | 'lead' | 'task' | 'system';
}

export type ActiveNavTab = 
  | 'overview'
  | 'contacts'
  | 'companies'
  | 'leads'
  | 'deals'
  | 'pipeline'
  | 'activities'
  | 'tasks'
  | 'calendar'
  | 'ai-insights'
  | 'reports'
  | 'settings';

export type DateRangeFilter = '7d' | '30d' | '90d' | '12m';

export type FinancialTimeRange = 'today' | '7d' | 'last_month' | 'last_6m' | 'last_year';
