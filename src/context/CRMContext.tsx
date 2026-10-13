import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Contact,
  Company,
  Lead,
  Deal,
  Activity,
  Task,
  CalendarEvent,
  NotificationItem,
  DealStage,
  LeadStatus,
  ActiveNavTab,
  DateRangeFilter,
} from '../types/crm';
import {
  INITIAL_COMPANIES,
  INITIAL_CONTACTS,
  INITIAL_LEADS,
  INITIAL_DEALS,
  INITIAL_ACTIVITIES,
  INITIAL_TASKS,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_NOTIFICATIONS,
} from '../data/initialData';

export interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  timestamp: number;
}

export interface SearchResultItem {
  id: string;
  type: 'contact' | 'company' | 'deal' | 'lead';
  title: string;
  subtitle: string;
  meta: string;
}

interface CRMContextType {
  // Navigation & Filters
  currentTab: ActiveNavTab;
  setCurrentTab: (tab: ActiveNavTab) => void;
  dateRange: DateRangeFilter;
  setDateRange: (range: DateRangeFilter) => void;
  searchModalOpen: boolean;
  setSearchModalOpen: (open: boolean) => void;
  quickCreateOpen: boolean;
  setQuickCreateOpen: (open: boolean) => void;
  quickCreateDefaultType: 'contact' | 'company' | 'lead' | 'deal' | 'task' | 'activity';
  openQuickCreate: (type?: 'contact' | 'company' | 'lead' | 'deal' | 'task' | 'activity') => void;

  // State Collections
  contacts: Contact[];
  companies: Company[];
  leads: Lead[];
  deals: Deal[];
  activities: Activity[];
  tasks: Task[];
  calendarEvents: CalendarEvent[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  toasts: Toast[];

  // Selected Detail Drawers
  selectedContactId: string | null;
  setSelectedContactId: (id: string | null) => void;
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;
  selectedDealId: string | null;
  setSelectedDealId: (id: string | null) => void;

  // CRUD Operations
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'notesCount'>) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  archiveContact: (id: string) => void;

  addCompany: (company: Omit<Company, 'id' | 'createdAt' | 'openDealsCount' | 'totalDealValue' | 'contactsCount' | 'lastInteractionAt'>) => void;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  deleteCompany: (id: string) => void;

  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  updateLeadStatus: (id: string, status: LeadStatus) => void;
  bulkUpdateLeadStatus: (ids: string[], status: LeadStatus) => void;
  convertLeadToContact: (leadId: string, options?: { createDeal?: boolean; dealValue?: number; dealName?: string }) => void;

  addDeal: (deal: Omit<Deal, 'id' | 'createdAt' | 'daysInStage' | 'lastActivityAt'>) => void;
  updateDeal: (id: string, updates: Partial<Deal>) => void;
  deleteDeal: (id: string) => void;
  moveDealStage: (id: string, newStage: DealStage) => void;
  markDealWon: (id: string, cost?: number) => void;
  markDealLost: (id: string, reason: string) => void;

  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;

  logActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;

  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;
  addToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;

  // Demo Data & Utils
  resetDemoData: () => void;
  exportDataJSON: () => void;
  globalSearch: (query: string) => SearchResultItem[];
}

const STORAGE_KEY_PREFIX = 'flowdesk_crm_';

const CRMContext = createContext<CRMContextType | undefined>(undefined);

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) && typeof parsed === 'object') return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage write error', e);
  }
}

export const CRMProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTab, setCurrentTab] = useState<ActiveNavTab>('overview');
  const [dateRange, setDateRange] = useState<DateRangeFilter>('30d');
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateDefaultType, setQuickCreateDefaultType] = useState<'contact' | 'company' | 'lead' | 'deal' | 'task' | 'activity'>('contact');

  // Selected detail drawers
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  // Entities state with local storage hydration
  const [companies, setCompanies] = useState<Company[]>(() => loadFromStorage('companies', INITIAL_COMPANIES));
  const [contacts, setContacts] = useState<Contact[]>(() => loadFromStorage('contacts', INITIAL_CONTACTS));
  const [leads, setLeads] = useState<Lead[]>(() => loadFromStorage('leads', INITIAL_LEADS));
  const [deals, setDeals] = useState<Deal[]>(() => loadFromStorage('deals', INITIAL_DEALS));
  const [activities, setActivities] = useState<Activity[]>(() => loadFromStorage('activities', INITIAL_ACTIVITIES));
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage('tasks', INITIAL_TASKS));
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => loadFromStorage('calendar_events', INITIAL_CALENDAR_EVENTS));
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => loadFromStorage('notifications', INITIAL_NOTIFICATIONS));
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Sync to local storage
  useEffect(() => { saveToStorage('companies', companies); }, [companies]);
  useEffect(() => { saveToStorage('contacts', contacts); }, [contacts]);
  useEffect(() => { saveToStorage('leads', leads); }, [leads]);
  useEffect(() => { saveToStorage('deals', deals); }, [deals]);
  useEffect(() => { saveToStorage('activities', activities); }, [activities]);
  useEffect(() => { saveToStorage('tasks', tasks); }, [tasks]);
  useEffect(() => { saveToStorage('calendar_events', calendarEvents); }, [calendarEvents]);
  useEffect(() => { saveToStorage('notifications', notifications); }, [notifications]);

  // Toast Helper
  const addToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, timestamp: Date.now() }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const openQuickCreate = (type: 'contact' | 'company' | 'lead' | 'deal' | 'task' | 'activity' = 'contact') => {
    setQuickCreateDefaultType(type);
    setQuickCreateOpen(true);
  };

  // Synchronize company statistics dynamically from deals and contacts
  const syncCompanyAggregates = (currentDeals: Deal[], currentContacts: Contact[]) => {
    setCompanies((prevComps) =>
      prevComps.map((comp) => {
        const compDeals = currentDeals.filter((d) => d.companyId === comp.id);
        const openDeals = compDeals.filter((d) => d.stage !== 'won' && d.stage !== 'lost');
        const totalVal = compDeals.reduce((sum, d) => sum + d.value, 0);
        const linkedContacts = currentContacts.filter((c) => c.companyId === comp.id);
        return {
          ...comp,
          openDealsCount: openDeals.length,
          totalDealValue: totalVal,
          contactsCount: linkedContacts.length,
        };
      })
    );
  };

  // Contacts
  const addContact = (contactData: Omit<Contact, 'id' | 'createdAt' | 'notesCount'>) => {
    const newContact: Contact = {
      ...contactData,
      id: 'cont-' + Date.now(),
      createdAt: new Date().toISOString(),
      notesCount: 0,
    };
    const updatedContacts = [newContact, ...contacts];
    setContacts(updatedContacts);
    syncCompanyAggregates(deals, updatedContacts);

    logActivity({
      type: 'note',
      title: 'New Contact Created',
      description: `Added ${newContact.name} (${newContact.role}) at ${newContact.companyName}.`,
      relatedTo: { type: 'contact', id: newContact.id, name: newContact.name },
      performedBy: 'Alex Morgan',
    });
    addToast(`Contact "${newContact.name}" added successfully.`);
  };

  const updateContact = (id: string, updates: Partial<Contact>) => {
    const updatedContacts = contacts.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setContacts(updatedContacts);

    // If contact name changed, update deals that reference this contact
    if (updates.name) {
      setDeals((prev) =>
        prev.map((d) => (d.contactId === id ? { ...d, contactName: updates.name! } : d))
      );
    }
    syncCompanyAggregates(deals, updatedContacts);
    addToast('Contact updated successfully.');
  };

  const deleteContact = (id: string) => {
    const target = contacts.find((c) => c.id === id);
    const updatedContacts = contacts.filter((c) => c.id !== id);
    setContacts(updatedContacts);
    if (selectedContactId === id) setSelectedContactId(null);
    syncCompanyAggregates(deals, updatedContacts);
    addToast(`Contact ${target ? target.name : ''} deleted.`, 'info');
  };

  const archiveContact = (id: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isArchived: !c.isArchived } : c))
    );
    addToast('Contact archive status updated.');
  };

  // Companies
  const addCompany = (companyData: Omit<Company, 'id' | 'createdAt' | 'openDealsCount' | 'totalDealValue' | 'contactsCount' | 'lastInteractionAt'>) => {
    const newCompany: Company = {
      ...companyData,
      id: 'comp-' + Date.now(),
      openDealsCount: 0,
      totalDealValue: 0,
      contactsCount: 0,
      lastInteractionAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setCompanies((prev) => [newCompany, ...prev]);
    addToast(`Company "${newCompany.name}" added.`);
  };

  const updateCompany = (id: string, updates: Partial<Company>) => {
    setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));

    // If company name changed, update associated contacts and deals
    if (updates.name) {
      setContacts((prev) =>
        prev.map((c) => (c.companyId === id ? { ...c, companyName: updates.name! } : c))
      );
      setDeals((prev) =>
        prev.map((d) => (d.companyId === id ? { ...d, companyName: updates.name! } : d))
      );
    }
    addToast('Company updated.');
  };

  const deleteCompany = (id: string) => {
    const target = companies.find((c) => c.id === id);
    setCompanies((prev) => prev.filter((c) => c.id !== id));
    if (selectedCompanyId === id) setSelectedCompanyId(null);
    addToast(`Company ${target ? target.name : ''} deleted.`, 'info');
  };

  // Leads
  const addLead = (leadData: Omit<Lead, 'id' | 'createdAt'>) => {
    const newLead: Lead = {
      ...leadData,
      id: 'lead-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setLeads((prev) => [newLead, ...prev]);
    addToast(`Lead "${newLead.name}" qualified with score ${newLead.score}.`);
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
    addToast('Lead details updated.');
  };

  const deleteLead = (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    if (selectedLeadId === id) setSelectedLeadId(null);
    addToast('Lead removed.', 'info');
  };

  const updateLeadStatus = (id: string, status: LeadStatus) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status, lastContactedAt: new Date().toISOString() } : l))
    );
    addToast(`Lead status updated to ${status}.`);
  };

  const bulkUpdateLeadStatus = (ids: string[], status: LeadStatus) => {
    setLeads((prev) =>
      prev.map((l) => (ids.includes(l.id) ? { ...l, status, lastContactedAt: new Date().toISOString() } : l))
    );
    addToast(`Updated ${ids.length} leads to "${status}".`);
  };

  // Lead-to-Contact & Opportunity Conversion (prevents duplicates)
  const convertLeadToContact = (
    leadId: string,
    options?: { createDeal?: boolean; dealValue?: number; dealName?: string }
  ) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    // Check if contact already exists with this email
    let contact = contacts.find((c) => c.email.toLowerCase() === lead.email.toLowerCase());
    let company = companies.find((comp) => comp.name.toLowerCase() === lead.company.toLowerCase());

    // Create company if it doesn't exist
    if (!company) {
      company = {
        id: 'comp-' + Date.now(),
        name: lead.company,
        domain: `${lead.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        industry: lead.industry || 'Technology',
        size: lead.companySize || '50-100',
        employeeCount: 100,
        location: lead.country || 'Global',
        openDealsCount: 0,
        totalDealValue: 0,
        contactsCount: 1,
        lastInteractionAt: new Date().toISOString(),
        logoBg: 'bg-teal-600',
        about: `Ingested from lead qualification for ${lead.company}.`,
        createdAt: new Date().toISOString(),
      };
      setCompanies((prev) => [company!, ...prev]);
    }

    if (!contact) {
      contact = {
        id: 'cont-' + Date.now(),
        name: lead.name,
        email: lead.email,
        phone: '+1 (555) 010-2345',
        role: lead.role,
        companyId: company.id,
        companyName: company.name,
        country: lead.country,
        leadSource: lead.source,
        lifecycleStage: 'opportunity',
        owner: lead.owner || 'Alex Morgan',
        lastActivityAt: new Date().toISOString(),
        nextFollowUpAt: new Date(Date.now() + 3 * 86400000).toISOString(),
        notesCount: 1,
        tags: ['Converted Lead', 'Opportunity'],
        createdAt: new Date().toISOString(),
      };
      const updatedContacts = [contact, ...contacts];
      setContacts(updatedContacts);
      syncCompanyAggregates(deals, updatedContacts);
    }

    // Optionally create an initial deal
    if (options?.createDeal) {
      const dealVal = options.dealValue || 45000;
      const newDeal: Deal = {
        id: 'deal-' + Date.now(),
        name: options.dealName || `${company.name} - Enterprise Solution`,
        companyId: company.id,
        companyName: company.name,
        contactId: contact.id,
        contactName: contact.name,
        value: dealVal,
        currency: 'USD',
        stage: 'qualified',
        probability: 40,
        expectedCloseDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        owner: lead.owner || 'Alex Morgan',
        daysInStage: 0,
        priority: 'high',
        createdAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
      };
      const updatedDeals = [newDeal, ...deals];
      setDeals(updatedDeals);
      syncCompanyAggregates(updatedDeals, contacts);
    }

    // Update lead status to engaged / converted
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? { ...l, status: 'engaged', lastContactedAt: new Date().toISOString(), nextAction: 'Opportunity created and active' }
          : l
      )
    );

    logActivity({
      type: 'stage_change',
      title: `Lead Converted to Contact: ${lead.name}`,
      description: `Converted ${lead.name} from ${lead.company} to a qualified opportunity contact.`,
      relatedTo: { type: 'contact', id: contact.id, name: contact.name },
      performedBy: 'Alex Morgan',
    });

    addToast(`Lead "${lead.name}" converted to Contact & Opportunity!`, 'success');
  };

  // Deals
  const addDeal = (dealData: Omit<Deal, 'id' | 'createdAt' | 'daysInStage' | 'lastActivityAt'>) => {
    const newDeal: Deal = {
      ...dealData,
      id: 'deal-' + Date.now(),
      daysInStage: 0,
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };
    const updatedDeals = [newDeal, ...deals];
    setDeals(updatedDeals);
    syncCompanyAggregates(updatedDeals, contacts);

    logActivity({
      type: 'deal_update',
      title: `New Deal Created: ${newDeal.name}`,
      description: `Valued at $${newDeal.value.toLocaleString()} in stage "${newDeal.stage}". Owner: ${newDeal.owner}.`,
      relatedTo: { type: 'deal', id: newDeal.id, name: newDeal.name },
      performedBy: newDeal.owner,
    });
    addToast(`Deal "${newDeal.name}" ($${newDeal.value.toLocaleString()}) created.`);
  };

  const updateDeal = (id: string, updates: Partial<Deal>) => {
    const updatedDeals = deals.map((d) => (d.id === id ? { ...d, ...updates, lastActivityAt: new Date().toISOString() } : d));
    setDeals(updatedDeals);
    syncCompanyAggregates(updatedDeals, contacts);
    addToast('Deal updated successfully.');
  };

  const deleteDeal = (id: string) => {
    const target = deals.find((d) => d.id === id);
    const updatedDeals = deals.filter((d) => d.id !== id);
    setDeals(updatedDeals);
    if (selectedDealId === id) setSelectedDealId(null);
    syncCompanyAggregates(updatedDeals, contacts);
    addToast(`Deal ${target ? target.name : ''} deleted.`, 'info');
  };

  const moveDealStage = (id: string, newStage: DealStage) => {
    const deal = deals.find((d) => d.id === id);
    if (!deal || deal.stage === newStage) return;

    const stageProbabilities: Record<DealStage, number> = {
      new: 20,
      qualified: 40,
      discovery: 50,
      proposal: 65,
      negotiation: 80,
      won: 100,
      lost: 0,
    };

    const updatedDeals = deals.map((d) =>
      d.id === id
        ? {
            ...d,
            stage: newStage,
            probability: stageProbabilities[newStage] ?? d.probability,
            daysInStage: 0,
            actualCloseDate:
              newStage === 'won' || newStage === 'lost'
                ? d.actualCloseDate || new Date().toISOString()
                : undefined,
            lastActivityAt: new Date().toISOString(),
          }
        : d
    );

    setDeals(updatedDeals);
    syncCompanyAggregates(updatedDeals, contacts);

    logActivity({
      type: 'stage_change',
      title: `Moved deal to ${newStage.toUpperCase()}`,
      description: `${deal.name} moved from ${deal.stage} to ${newStage}. Value: $${deal.value.toLocaleString()}`,
      relatedTo: { type: 'deal', id: deal.id, name: deal.name },
      performedBy: deal.owner,
    });

    addToast(`Deal "${deal.name}" moved to ${newStage}.`);
  };

  const markDealWon = (id: string, cost?: number) => {
    const deal = deals.find((d) => d.id === id);
    if (!deal) return;

    const updatedDeals = deals.map((d) =>
      d.id === id
        ? {
            ...d,
            stage: 'won' as DealStage,
            probability: 100,
            daysInStage: 0,
            cost: cost !== undefined ? cost : d.cost,
            actualCloseDate: d.actualCloseDate || new Date().toISOString(),
            lastActivityAt: new Date().toISOString(),
          }
        : d
    );

    setDeals(updatedDeals);
    syncCompanyAggregates(updatedDeals, contacts);

    logActivity({
      type: 'stage_change',
      title: `🎉 Deal Won: $${deal.value.toLocaleString()}`,
      description: `Contract successfully closed for ${deal.name}.`,
      relatedTo: { type: 'deal', id: deal.id, name: deal.name },
      performedBy: deal.owner,
    });

    addToast(`Deal "${deal.name}" marked as WON!`, 'success');
  };

  const markDealLost = (id: string, reason: string) => {
    const deal = deals.find((d) => d.id === id);
    if (!deal) return;

    const updatedDeals = deals.map((d) =>
      d.id === id
        ? {
            ...d,
            stage: 'lost' as DealStage,
            probability: 0,
            lostReason: reason,
            daysInStage: 0,
            actualCloseDate: d.actualCloseDate || new Date().toISOString(),
            lastActivityAt: new Date().toISOString(),
          }
        : d
    );

    setDeals(updatedDeals);
    syncCompanyAggregates(updatedDeals, contacts);

    logActivity({
      type: 'deal_update',
      title: `Deal Closed Lost: ${deal.name}`,
      description: `Reason: ${reason}`,
      relatedTo: { type: 'deal', id: deal.id, name: deal.name },
      performedBy: deal.owner,
    });

    addToast(`Deal "${deal.name}" marked as lost.`, 'info');
  };

  // Tasks
  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    const newTask: Task = {
      ...taskData,
      id: 'task-' + Date.now(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    addToast(`Task "${newTask.title}" scheduled.`);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    addToast('Task updated.');
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    addToast('Task deleted.', 'info');
  };

  const toggleTaskComplete = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: nextStatus,
              completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined,
            }
          : t
      )
    );

    if (nextStatus === 'completed') {
      logActivity({
        type: 'task',
        title: `Task Completed: ${task.title}`,
        description: `Marked finished by ${task.owner}.`,
        relatedTo: { type: task.relatedTo.type, id: task.relatedTo.id, name: task.relatedTo.name },
        performedBy: task.owner,
      });
      addToast(`Task "${task.title}" completed!`);
    } else {
      addToast(`Task reopened.`);
    }
  };

  // Activities
  const logActivity = (activityData: Omit<Activity, 'id' | 'timestamp'>) => {
    const newAct: Activity = {
      ...activityData,
      id: 'act-' + Date.now(),
      timestamp: new Date().toISOString(),
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  // Calendar
  const addCalendarEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: 'cal-' + Date.now(),
    };
    setCalendarEvents((prev) => [newEvent, ...prev]);
    addToast(`Event "${newEvent.title}" scheduled.`);
  };

  const updateCalendarEvent = (id: string, updates: Partial<CalendarEvent>) => {
    setCalendarEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    addToast('Calendar event updated.');
  };

  const deleteCalendarEvent = (id: string) => {
    setCalendarEvents((prev) => prev.filter((e) => e.id !== id));
    addToast('Calendar event removed.', 'info');
  };

  // Notifications
  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast('All notifications marked as read.');
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Reset Demo Data
  const resetDemoData = () => {
    setCompanies(INITIAL_COMPANIES);
    setContacts(INITIAL_CONTACTS);
    setLeads(INITIAL_LEADS);
    setDeals(INITIAL_DEALS);
    setActivities(INITIAL_ACTIVITIES);
    setTasks(INITIAL_TASKS);
    setCalendarEvents(INITIAL_CALENDAR_EVENTS);
    setNotifications(INITIAL_NOTIFICATIONS);

    saveToStorage('companies', INITIAL_COMPANIES);
    saveToStorage('contacts', INITIAL_CONTACTS);
    saveToStorage('leads', INITIAL_LEADS);
    saveToStorage('deals', INITIAL_DEALS);
    saveToStorage('activities', INITIAL_ACTIVITIES);
    saveToStorage('tasks', INITIAL_TASKS);
    saveToStorage('calendar_events', INITIAL_CALENDAR_EVENTS);
    saveToStorage('notifications', INITIAL_NOTIFICATIONS);

    addToast('Demo database restored to default state.', 'info');
  };

  // Export JSON
  const exportDataJSON = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: 'Flowdesk AI CRM',
      version: '1.0.0',
      data: {
        companies,
        contacts,
        leads,
        deals,
        activities,
        tasks,
        calendarEvents,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowdesk-crm-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('CRM data exported as JSON.');
  };

  // Global Search
  const globalSearch = (query: string): SearchResultItem[] => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const results: SearchResultItem[] = [];

    // Contacts
    contacts.forEach((c) => {
      if (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.companyName.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q)
      ) {
        results.push({
          id: c.id,
          type: 'contact',
          title: c.name,
          subtitle: `${c.role} at ${c.companyName}`,
          meta: c.email,
        });
      }
    });

    // Deals
    deals.forEach((d) => {
      if (
        d.name.toLowerCase().includes(q) ||
        d.companyName.toLowerCase().includes(q) ||
        d.stage.toLowerCase().includes(q)
      ) {
        results.push({
          id: d.id,
          type: 'deal',
          title: d.name,
          subtitle: `$${d.value.toLocaleString()} · Stage: ${d.stage.toUpperCase()}`,
          meta: d.companyName,
        });
      }
    });

    // Companies
    companies.forEach((comp) => {
      if (
        comp.name.toLowerCase().includes(q) ||
        comp.industry.toLowerCase().includes(q) ||
        comp.location.toLowerCase().includes(q)
      ) {
        results.push({
          id: comp.id,
          type: 'company',
          title: comp.name,
          subtitle: `${comp.industry} · ${comp.location}`,
          meta: `${comp.employeeCount} employees`,
        });
      }
    });

    // Leads
    leads.forEach((l) => {
      if (
        l.name.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q)
      ) {
        results.push({
          id: l.id,
          type: 'lead',
          title: l.name,
          subtitle: `${l.role} at ${l.company}`,
          meta: `Score: ${l.score}/100`,
        });
      }
    });

    return results.slice(0, 15);
  };

  return (
    <CRMContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        dateRange,
        setDateRange,
        searchModalOpen,
        setSearchModalOpen,
        quickCreateOpen,
        setQuickCreateOpen,
        quickCreateDefaultType,
        openQuickCreate,

        contacts,
        companies,
        leads,
        deals,
        activities,
        tasks,
        calendarEvents,
        notifications,
        unreadNotificationCount,
        toasts,

        selectedContactId,
        setSelectedContactId,
        selectedCompanyId,
        setSelectedCompanyId,
        selectedLeadId,
        setSelectedLeadId,
        selectedDealId,
        setSelectedDealId,

        addContact,
        updateContact,
        deleteContact,
        archiveContact,

        addCompany,
        updateCompany,
        deleteCompany,

        addLead,
        updateLead,
        deleteLead,
        updateLeadStatus,
        bulkUpdateLeadStatus,
        convertLeadToContact,

        addDeal,
        updateDeal,
        deleteDeal,
        moveDealStage,
        markDealWon,
        markDealLost,

        addTask,
        updateTask,
        deleteTask,
        toggleTaskComplete,

        logActivity,
        addCalendarEvent,
        updateCalendarEvent,
        deleteCalendarEvent,

        markAllNotificationsRead,
        dismissNotification,
        addToast,
        removeToast,

        resetDemoData,
        exportDataJSON,
        globalSearch,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};
