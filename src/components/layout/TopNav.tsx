import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Plus,
  Bell,
  Calendar,
  ChevronDown,
  User,
  Building,
  UserCheck,
  Briefcase,
  CheckSquare,
  Activity,
  Check,
  Trash2,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { DateRangeFilter } from '../../types/crm';

interface TopNavProps {
  onOpenMobileSidebar: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenMobileSidebar }) => {
  const {
    currentTab,
    dateRange,
    setDateRange,
    setSearchModalOpen,
    openQuickCreate,
    notifications,
    unreadNotificationCount,
    markAllNotificationsRead,
    dismissNotification,
  } = useCRM();

  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dateMenuOpen, setDateMenuOpen] = useState(false);

  const createMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const dateMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setCreateMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (dateMenuRef.current && !dateMenuRef.current.contains(event.target as Node)) {
        setDateMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format tab title for breadcrumbs
  const tabNames: Record<string, string> = {
    overview: 'Overview',
    contacts: 'Contacts',
    companies: 'Companies',
    leads: 'Lead Qualification',
    deals: 'Deals & Pipeline',
    pipeline: 'Sales Pipeline Kanban',
    activities: 'Activities Timeline',
    tasks: 'Tasks & Follow-ups',
    calendar: 'Sales Calendar',
    'ai-insights': 'Flow AI Sales Intelligence',
    reports: 'Reports & Analytics',
    settings: 'Settings & Workspace',
  };

  const dateLabels: Record<DateRangeFilter, string> = {
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days',
    '12m': 'Last 12 Months',
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 md:px-6 flex items-center justify-between shrink-0 sticky top-0 z-10">
      {/* Left: Mobile hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          aria-label="Open mobile menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400 font-medium hidden sm:inline">Workspace</span>
          <span className="text-slate-300 hidden sm:inline">/</span>
          <h1 className="font-semibold text-slate-800 text-sm md:text-base">
            {tabNames[currentTab] || 'Dashboard'}
          </h1>
        </div>
      </div>

      {/* Center & Right: Search, Quick-Create, Date filter, Notifications, Avatar */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Global Search trigger bar */}
        <button
          onClick={() => setSearchModalOpen(true)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200 text-slate-500 text-xs md:text-sm transition w-36 sm:w-56 md:w-64"
          title="Search contacts, deals, companies... (Cmd + K)"
        >
          <Search size={15} className="text-slate-400 shrink-0" />
          <span className="truncate text-left text-slate-400">Search CRM...</span>
          <kbd className="hidden lg:inline-flex ml-auto text-[10px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-400 font-mono shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Date Filter selector */}
        <div className="relative hidden sm:block" ref={dateMenuRef}>
          <button
            onClick={() => setDateMenuOpen(!dateMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition shadow-2xs"
          >
            <Calendar size={14} className="text-slate-400" />
            <span>{dateLabels[dateRange]}</span>
            <ChevronDown size={13} className="text-slate-400" />
          </button>

          {dateMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 animate-in fade-in zoom-in-95">
              {(['7d', '30d', '90d', '12m'] as DateRangeFilter[]).map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setDateRange(range);
                    setDateMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left ${
                    dateRange === range ? 'bg-teal-50 text-teal-800 font-medium' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{dateLabels[range]}</span>
                  {dateRange === range && <Check size={14} className="text-teal-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Create Dropdown Button */}
        <div className="relative" ref={createMenuRef}>
          <button
            onClick={() => setCreateMenuOpen(!createMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs md:text-sm shadow-xs transition"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New</span>
            <ChevronDown size={14} className="opacity-80" />
          </button>

          {createMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-30 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Quick Record Creation
              </div>
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  openQuickCreate('contact');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
              >
                <User size={15} className="text-slate-500" />
                <span>New Contact</span>
              </button>
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  openQuickCreate('deal');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
              >
                <Briefcase size={15} className="text-teal-600" />
                <span>New Deal</span>
              </button>
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  openQuickCreate('lead');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
              >
                <UserCheck size={15} className="text-blue-600" />
                <span>New Lead</span>
              </button>
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  openQuickCreate('company');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
              >
                <Building size={15} className="text-slate-500" />
                <span>New Company</span>
              </button>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  openQuickCreate('task');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
              >
                <CheckSquare size={15} className="text-amber-600" />
                <span>Schedule Task</span>
              </button>
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  openQuickCreate('activity');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
              >
                <Activity size={15} className="text-violet-600" />
                <span>Log Activity</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 relative transition"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-teal-500 ring-2 ring-white" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-2xl py-2 z-30 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">Notifications</h4>
                  <p className="text-[11px] text-slate-400">
                    {unreadNotificationCount} unread alert{unreadNotificationCount === 1 ? '' : 's'}
                  </p>
                </div>
                {unreadNotificationCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-[11px] text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-400">
                    No notifications
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 text-xs hover:bg-slate-50 transition flex items-start gap-2.5 ${
                        !item.read ? 'bg-teal-50/30' : ''
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{item.title}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">{item.message}</p>
                      </div>
                      <button
                        onClick={() => dismissNotification(item.id)}
                        className="text-slate-300 hover:text-slate-500 p-0.5"
                        title="Dismiss"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar indicator */}
        <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
          <div className="h-8 w-8 rounded-full bg-teal-800 text-white flex items-center justify-center text-xs font-semibold ring-1 ring-slate-200 shadow-2xs">
            AM
          </div>
        </div>
      </div>
    </header>
  );
};
