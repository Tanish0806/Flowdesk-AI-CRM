import React, { useState, useEffect } from 'react';
import { X, User, Building, Briefcase, UserCheck, CheckSquare, Activity as ActivityIcon } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { DealStage, LeadSource, LifecycleStage, TaskPriority, ActivityType } from '../../types/crm';

export const QuickCreateModal: React.FC = () => {
  const {
    quickCreateOpen,
    setQuickCreateOpen,
    quickCreateDefaultType,
    companies,
    contacts,
    deals,
    addContact,
    addCompany,
    addLead,
    addDeal,
    addTask,
    logActivity,
  } = useCRM();

  const [activeTab, setActiveTab] = useState<'contact' | 'company' | 'lead' | 'deal' | 'task' | 'activity'>('contact');

  useEffect(() => {
    if (quickCreateOpen) {
      setActiveTab(quickCreateDefaultType);
    }
  }, [quickCreateOpen, quickCreateDefaultType]);

  // Form states
  // Contact
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cRole, setCRole] = useState('');
  const [cCompanyId, setCCompanyId] = useState('');
  const [cCountry, setCCountry] = useState('United States');
  const [cSource, setCSource] = useState<LeadSource>('Inbound Website');
  const [cStage, setCStage] = useState<LifecycleStage>('lead');

  // Company
  const [compName, setCompName] = useState('');
  const [compDomain, setCompDomain] = useState('');
  const [compIndustry, setCompIndustry] = useState('Software & Cloud');
  const [compSize, setCompSize] = useState('100-250');
  const [compLocation, setCompLocation] = useState('San Francisco, CA');
  const [compAbout, setCompAbout] = useState('');

  // Lead
  const [lName, setLName] = useState('');
  const [lEmail, setLEmail] = useState('');
  const [lCompany, setLCompany] = useState('');
  const [lRole, setLRole] = useState('');
  const [lSource, setLSource] = useState<LeadSource>('Inbound Website');
  const [lCountry, setLCountry] = useState('United States');
  const [lIndustry, setLIndustry] = useState('Technology');
  const [lSize, setLSize] = useState('50-100');
  const [lNotes, setLNotes] = useState('');

  // Deal
  const [dName, setDName] = useState('');
  const [dCompanyId, setDCompanyId] = useState('');
  const [dContactId, setDContactId] = useState('');
  const [dValue, setDValue] = useState('45000');
  const [dCost, setDCost] = useState('');
  const [dStage, setDStage] = useState<DealStage>('qualified');
  const [dProb, setDProb] = useState(40);
  const [dCloseDate, setDCloseDate] = useState('2026-11-15');
  const [dPriority, setDPriority] = useState<TaskPriority>('medium');
  const [dNotes, setDNotes] = useState('');

  // Task
  const [tTitle, setTTitle] = useState('');
  const [tDue, setTDue] = useState('2026-10-18T17:00');
  const [tPriority, setTPriority] = useState<TaskPriority>('medium');
  const [tOwner, setTOwner] = useState('Alex Morgan');
  const [tRelatedType, setTRelatedType] = useState<'contact' | 'deal' | 'company'>('deal');
  const [tRelatedId, setTRelatedId] = useState('');

  // Activity
  const [aType, setAType] = useState<ActivityType>('meeting');
  const [aTitle, setATitle] = useState('');
  const [aDesc, setADesc] = useState('');
  const [aRelatedType, setARelatedType] = useState<'contact' | 'deal' | 'company'>('contact');
  const [aRelatedId, setARelatedId] = useState('');

  // Populate first available company when opened
  useEffect(() => {
    if (companies.length > 0 && !cCompanyId) setCCompanyId(companies[0].id);
    if (companies.length > 0 && !dCompanyId) setDCompanyId(companies[0].id);
    if (contacts.length > 0 && !dContactId) setDContactId(contacts[0].id);
    if (deals.length > 0 && !tRelatedId) setTRelatedId(deals[0].id);
    if (contacts.length > 0 && !aRelatedId) setARelatedId(contacts[0].id);
  }, [companies, contacts, deals]);

  if (!quickCreateOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'contact') {
      if (!cName || !cEmail) return;
      const comp = companies.find((c) => c.id === cCompanyId);
      addContact({
        name: cName,
        email: cEmail,
        phone: cPhone || '+1 (555) 000-0000',
        role: cRole || 'Product Lead',
        companyId: cCompanyId || (companies[0]?.id ?? 'comp-1'),
        companyName: comp?.name || 'Independent',
        country: cCountry,
        leadSource: cSource,
        lifecycleStage: cStage,
        owner: 'Alex Morgan',
        lastActivityAt: new Date().toISOString(),
        tags: ['New Contact'],
      });
    } else if (activeTab === 'company') {
      if (!compName) return;
      addCompany({
        name: compName,
        domain: compDomain || `${compName.toLowerCase().replace(/\s+/g, '')}.com`,
        industry: compIndustry,
        size: compSize,
        employeeCount: 120,
        location: compLocation,
        logoBg: 'bg-teal-600',
        about: compAbout || 'Enterprise organization evaluated via Flowdesk CRM.',
      });
    } else if (activeTab === 'lead') {
      if (!lName || !lCompany) return;
      // Calculate realistic score
      const score = Math.floor(65 + Math.random() * 25);
      addLead({
        name: lName,
        email: lEmail || `${lName.toLowerCase().replace(/\s+/g, '.')}@${lCompany.toLowerCase().replace(/\s+/g, '')}.com`,
        company: lCompany,
        role: lRole || 'Department Lead',
        source: lSource,
        country: lCountry,
        industry: lIndustry,
        companySize: lSize,
        score,
        scoreBreakdown: {
          companySize: 20,
          titleMatch: 20,
          productIntent: 20,
          engagement: 10,
          budgetFit: 10,
        },
        status: 'qualified',
        owner: 'Alex Morgan',
        lastContactedAt: new Date().toISOString(),
        nextAction: 'Schedule qualification call',
        notes: lNotes,
      });
    } else if (activeTab === 'deal') {
      if (!dName) return;
      const comp = companies.find((c) => c.id === dCompanyId);
      const cont = contacts.find((c) => c.id === dContactId);
      addDeal({
        name: dName,
        companyId: dCompanyId || (companies[0]?.id ?? 'comp-1'),
        companyName: comp?.name || 'Enterprise Account',
        contactId: dContactId || (contacts[0]?.id ?? 'cont-1'),
        contactName: cont?.name || 'Primary Contact',
        value: Number(dValue) || 25000,
        currency: 'USD',
        cost: dCost.trim() ? Number(dCost) : undefined,
        stage: dStage,
        probability: Number(dProb) || 40,
        expectedCloseDate: dCloseDate,
        owner: 'Alex Morgan',
        priority: dPriority,
        notes: dNotes,
      });
    } else if (activeTab === 'task') {
      if (!tTitle) return;
      let relatedName = 'CRM Opportunity';
      if (tRelatedType === 'deal') {
        const found = deals.find((d) => d.id === tRelatedId);
        if (found) relatedName = found.name;
      } else if (tRelatedType === 'contact') {
        const found = contacts.find((c) => c.id === tRelatedId);
        if (found) relatedName = found.name;
      } else {
        const found = companies.find((c) => c.id === tRelatedId);
        if (found) relatedName = found.name;
      }

      addTask({
        title: tTitle,
        dueAt: new Date(tDue).toISOString(),
        priority: tPriority,
        owner: tOwner,
        relatedTo: {
          type: tRelatedType,
          id: tRelatedId || 'deal-1',
          name: relatedName,
        },
      });
    } else if (activeTab === 'activity') {
      if (!aTitle) return;
      let relName = 'Account Activity';
      if (aRelatedType === 'contact') {
        const found = contacts.find((c) => c.id === aRelatedId);
        if (found) relName = found.name;
      } else if (aRelatedType === 'deal') {
        const found = deals.find((d) => d.id === aRelatedId);
        if (found) relName = found.name;
      } else {
        const found = companies.find((c) => c.id === aRelatedId);
        if (found) relName = found.name;
      }

      logActivity({
        type: aType,
        title: aTitle,
        description: aDesc || 'Logged from quick create menu.',
        relatedTo: {
          type: aRelatedType,
          id: aRelatedId || 'cont-1',
          name: relName,
        },
        performedBy: 'Alex Morgan',
      });
    }

    setQuickCreateOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm md:text-base">Quick Create Record</h3>
            <p className="text-xs text-slate-500">Add a new entity directly to your workspace.</p>
          </div>
          <button
            onClick={() => setQuickCreateOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selectors */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-4 pt-2 gap-1 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition whitespace-nowrap ${
              activeTab === 'contact'
                ? 'border-teal-600 text-teal-700 bg-white rounded-t-md shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User size={13} />
            <span>Contact</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('deal')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition whitespace-nowrap ${
              activeTab === 'deal'
                ? 'border-teal-600 text-teal-700 bg-white rounded-t-md shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase size={13} />
            <span>Deal</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('lead')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition whitespace-nowrap ${
              activeTab === 'lead'
                ? 'border-teal-600 text-teal-700 bg-white rounded-t-md shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck size={13} />
            <span>Lead</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('company')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition whitespace-nowrap ${
              activeTab === 'company'
                ? 'border-teal-600 text-teal-700 bg-white rounded-t-md shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building size={13} />
            <span>Company</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('task')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition whitespace-nowrap ${
              activeTab === 'task'
                ? 'border-teal-600 text-teal-700 bg-white rounded-t-md shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare size={13} />
            <span>Task</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition whitespace-nowrap ${
              activeTab === 'activity'
                ? 'border-teal-600 text-teal-700 bg-white rounded-t-md shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ActivityIcon size={13} />
            <span>Activity</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[68vh] overflow-y-auto text-xs">
          {/* CONTACT FORM */}
          {activeTab === 'contact' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    placeholder="e.g. Jordan Sterling"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={cEmail}
                    onChange={(e) => setCEmail(e.target.value)}
                    placeholder="jordan@company.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Job Title / Role</label>
                  <input
                    type="text"
                    value={cRole}
                    onChange={(e) => setCRole(e.target.value)}
                    placeholder="VP Engineering"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Company</label>
                  <select
                    value={cCompanyId}
                    onChange={(e) => setCCompanyId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-xs bg-white"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={cPhone}
                    onChange={(e) => setCPhone(e.target.value)}
                    placeholder="+1 (415) 555-0192"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={cCountry}
                    onChange={(e) => setCCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Lead Source</label>
                  <select
                    value={cSource}
                    onChange={(e) => setCSource(e.target.value as LeadSource)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="Inbound Website">Inbound Website</option>
                    <option value="Outbound SDR">Outbound SDR</option>
                    <option value="Referral">Referral</option>
                    <option value="Conference / Event">Conference / Event</option>
                    <option value="Partner Ecosystem">Partner Ecosystem</option>
                    <option value="Product Signup">Product Signup</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* DEAL FORM */}
          {activeTab === 'deal' && (
            <>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Deal Title *</label>
                <input
                  type="text"
                  required
                  value={dName}
                  onChange={(e) => setDName(e.target.value)}
                  placeholder="e.g. CloudScale - Enterprise Annual Contract"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Company</label>
                  <select
                    value={dCompanyId}
                    onChange={(e) => setDCompanyId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Primary Contact</label>
                  <select
                    value={dContactId}
                    onChange={(e) => setDContactId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.companyName})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Deal Value (USD) *</label>
                  <input
                    type="number"
                    required
                    value={dValue}
                    onChange={(e) => setDValue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Initial Stage</label>
                  <select
                    value={dStage}
                    onChange={(e) => setDStage(e.target.value as DealStage)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white capitalize"
                  >
                    <option value="new">New Opportunity</option>
                    <option value="qualified">Qualified</option>
                    <option value="discovery">Discovery</option>
                    <option value="proposal">Proposal</option>
                    <option value="negotiation">Negotiation</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Probability (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={dProb}
                    onChange={(e) => setDProb(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Expected Close Date</label>
                  <input
                    type="date"
                    value={dCloseDate}
                    onChange={(e) => setDCloseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={dPriority}
                    onChange={(e) => setDPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white capitalize"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Estimated Cost (USD)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 10000"
                    value={dCost}
                    onChange={(e) => setDCost(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            </>
          )}

          {/* LEAD FORM */}
          {activeTab === 'lead' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Lead Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={lName}
                    onChange={(e) => setLName(e.target.value)}
                    placeholder="e.g. Rachel Adams"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={lCompany}
                    onChange={(e) => setLCompany(e.target.value)}
                    placeholder="e.g. Apex Dynamics"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Role / Designation</label>
                  <input
                    type="text"
                    value={lRole}
                    onChange={(e) => setLRole(e.target.value)}
                    placeholder="Head of Operations"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={lEmail}
                    onChange={(e) => setLEmail(e.target.value)}
                    placeholder="lead@company.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Source</label>
                  <select
                    value={lSource}
                    onChange={(e) => setLSource(e.target.value as LeadSource)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="Inbound Website">Inbound Website</option>
                    <option value="Outbound SDR">Outbound SDR</option>
                    <option value="Referral">Referral</option>
                    <option value="Conference / Event">Conference / Event</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Company Size</label>
                  <select
                    value={lSize}
                    onChange={(e) => setLSize(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="10-50">10-50 employees</option>
                    <option value="50-100">50-100 employees</option>
                    <option value="100-250">100-250 employees</option>
                    <option value="250-500">250-500 employees</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={lCountry}
                    onChange={(e) => setLCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            </>
          )}

          {/* COMPANY FORM */}
          {activeTab === 'company' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    placeholder="e.g. Helix Logistics"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Domain</label>
                  <input
                    type="text"
                    value={compDomain}
                    onChange={(e) => setCompDomain(e.target.value)}
                    placeholder="helixlogistics.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Industry</label>
                  <input
                    type="text"
                    value={compIndustry}
                    onChange={(e) => setCompIndustry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Headquarters</label>
                  <input
                    type="text"
                    value={compLocation}
                    onChange={(e) => setCompLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Size</label>
                  <select
                    value={compSize}
                    onChange={(e) => setCompSize(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="10-50">10-50</option>
                    <option value="50-100">50-100</option>
                    <option value="100-250">100-250</option>
                    <option value="250-500">250-500</option>
                    <option value="500-1000">500-1000</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* TASK FORM */}
          {activeTab === 'task' && (
            <>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={tTitle}
                  onChange={(e) => setTTitle(e.target.value)}
                  placeholder="e.g. Send enterprise SLA redline to legal team"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Due Date & Time</label>
                  <input
                    type="datetime-local"
                    value={tDue}
                    onChange={(e) => setTDue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={tPriority}
                    onChange={(e) => setTPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white capitalize"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Link to Entity</label>
                  <select
                    value={tRelatedType}
                    onChange={(e) => setTRelatedType(e.target.value as 'deal' | 'contact' | 'company')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white capitalize"
                  >
                    <option value="deal">Deal</option>
                    <option value="contact">Contact</option>
                    <option value="company">Company</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Select Record</label>
                  <select
                    value={tRelatedId}
                    onChange={(e) => setTRelatedId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    {tRelatedType === 'deal' &&
                      deals.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    {tRelatedType === 'contact' &&
                      contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    {tRelatedType === 'company' &&
                      companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* ACTIVITY FORM */}
          {activeTab === 'activity' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Activity Type</label>
                  <select
                    value={aType}
                    onChange={(e) => setAType(e.target.value as ActivityType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white capitalize"
                  >
                    <option value="meeting">Meeting</option>
                    <option value="call">Phone Call</option>
                    <option value="email">Email</option>
                    <option value="note">Internal Note</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Subject / Title *</label>
                  <input
                    type="text"
                    required
                    value={aTitle}
                    onChange={(e) => setATitle(e.target.value)}
                    placeholder="e.g. Discovery call on security requirements"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Notes / Summary</label>
                <textarea
                  rows={3}
                  value={aDesc}
                  onChange={(e) => setADesc(e.target.value)}
                  placeholder="Details of what was discussed, next steps agreed..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </>
          )}

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setQuickCreateOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-xs transition"
            >
              Create Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
