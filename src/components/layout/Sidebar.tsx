import React from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCheck,
  Briefcase,
  Kanban,
  Activity,
  CheckSquare,
  Calendar,
  Sparkles,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { ActiveNavTab } from '../../types/crm';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const { currentTab, setCurrentTab, leads, tasks, resetDemoData, deals } = useCRM();

  const activeLeadsCount = leads.filter((l) => l.status !== 'disqualified').length;
  const pendingTasksCount = tasks.filter((t) => t.status === 'pending').length;
  const activeDealsCount = deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost').length;

  const navItems: { id: ActiveNavTab; label: string; icon: React.FC<{ className?: string }>; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'leads', label: 'Leads', icon: UserCheck, count: activeLeadsCount },
    { id: 'deals', label: 'Deals', icon: Briefcase, count: activeDealsCount },
    { id: 'pipeline', label: 'Sales Pipeline', icon: Kanban },
    { id: 'activities', label: 'Activities', icon: Activity },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, count: pendingTasksCount },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'ai-insights', label: 'AI Insights', icon: Sparkles },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (tabId: ActiveNavTab) => {
    setCurrentTab(tabId);
    if (mobileOpen) setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#0F1117] text-slate-300 border-r border-slate-800/80">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-base text-white tracking-tight">Flowdesk</span>
                <span className="text-[10px] text-teal-400/90 font-medium tracking-wider uppercase">AI CRM Workspace</span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center h-7 w-7 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar collapse"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden flex items-center justify-center h-8 w-8 text-slate-400 hover:text-white"
            aria-label="Close navigation drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="p-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title={collapsed ? item.label : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-teal-400 rounded-r" />
                )}
                <Icon className={`shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                {!collapsed && (
                  <div className="flex items-center justify-between w-full overflow-hidden text-left">
                    <span className="truncate">{item.label}</span>
                    {item.count !== undefined && item.count > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded text-[11px] font-mono ${
                        isActive ? 'text-teal-300 bg-teal-400/20' : 'text-slate-400 bg-slate-800'
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area: Workspace & Demo Status */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        {/* Workspace Selector */}
        {!collapsed && (
          <div className="px-2 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800/60">
            <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Current Workspace</div>
            <div className="text-xs font-semibold text-slate-200 truncate mt-0.5">Acme Cloud HQ · Global</div>
          </div>
        )}

        {/* Demo status & Reset */}
        {!collapsed ? (
          <div className="flex items-center justify-between px-2 py-1 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
              Demo Data
            </span>
            <button
              onClick={resetDemoData}
              className="flex items-center gap-1 text-slate-400 hover:text-teal-300 transition"
              title="Reset sample records to initial state"
            >
              <RefreshCw size={11} />
              <span>Reset</span>
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={resetDemoData}
              className="p-1.5 rounded text-slate-400 hover:text-teal-300 hover:bg-slate-800"
              title="Reset Demo Data"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        )}

        {/* User profile preview */}
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-800/50 transition cursor-pointer">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-teal-600 to-cyan-500 text-white font-semibold flex items-center justify-center text-xs shrink-0 ring-1 ring-white/10">
            AM
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden text-left">
              <span className="text-xs font-semibold text-slate-200 truncate">Alex Morgan</span>
              <span className="text-[10px] text-slate-400 truncate">VP of Sales · Admin</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block transition-all duration-300 ease-in-out shrink-0 z-20 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 md:hidden transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
