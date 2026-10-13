import React, { useState } from 'react';
import { CRMProvider, useCRM } from './context/CRMContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { ToastContainer } from './components/layout/ToastContainer';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { QuickCreateModal } from './components/layout/QuickCreateModal';

import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { ContactsView } from './components/contacts/ContactsView';
import { CompaniesView } from './components/companies/CompaniesView';
import { LeadsView } from './components/leads/LeadsView';
import { DealsPipelineView } from './components/deals/DealsPipelineView';
import { ActivitiesView } from './components/activities/ActivitiesView';
import { TasksView } from './components/tasks/TasksView';
import { CalendarView } from './components/calendar/CalendarView';
import { AIInsightsView } from './components/ai/AIInsightsView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';

const MainContent: React.FC = () => {
  const { currentTab } = useCRM();

  const renderCurrentView = () => {
    switch (currentTab) {
      case 'overview':
        return <OverviewDashboard />;
      case 'contacts':
        return <ContactsView />;
      case 'companies':
        return <CompaniesView />;
      case 'leads':
        return <LeadsView />;
      case 'deals':
      case 'pipeline':
        return <DealsPipelineView />;
      case 'activities':
        return <ActivitiesView />;
      case 'tasks':
        return <TasksView />;
      case 'calendar':
        return <CalendarView />;
      case 'ai-insights':
        return <AIInsightsView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-50/60">
      {renderCurrentView()}
    </main>
  );
};

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <CRMProvider>
      <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-sans">
        {/* Navigation Sidebar */}
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopNav onOpenMobileSidebar={() => setMobileOpen(true)} />
          <MainContent />
        </div>

        {/* Global Overlays & Modals */}
        <GlobalSearchModal />
        <QuickCreateModal />
        <ToastContainer />
      </div>
    </CRMProvider>
  );
}
