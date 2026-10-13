import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Search,
  Filter,
  Plus,
  Flame,
  Award,
  CheckCircle,
  XCircle,
  HelpCircle,
  X,
  Clock,
  Mail,
  ChevronRight,
  Info,
  Trash2,
  CheckSquare,
  Edit2,
  ArrowRightCircle,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Lead, LeadStatus, LeadSource } from '../../types/crm';

export const LeadsView: React.FC = () => {
  const {
    leads,
    selectedLeadId,
    setSelectedLeadId,
    openQuickCreate,
    updateLead,
    deleteLead,
    updateLeadStatus,
    bulkUpdateLeadStatus,
    convertLeadToContact,
  } = useCRM();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLeadForScoreModal, setSelectedLeadForScoreModal] = useState<Lead | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Edit Lead Modal State
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editName, setEditName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSource, setEditSource] = useState<LeadSource>('Inbound Website');
  const [editIndustry, setEditIndustry] = useState('');
  const [editSize, setEditSize] = useState('50-100');
  const [editCountry, setEditCountry] = useState('United States');
  const [editScore, setEditScore] = useState(75);
  const [editNextAction, setEditNextAction] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Convert Lead Modal State
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [convertDealValue, setConvertDealValue] = useState(50000);
  const [convertCreateDeal, setConvertCreateDeal] = useState(true);

  const activeLead = useMemo(
    () => leads.find((l) => l.id === selectedLeadId) || null,
    [leads, selectedLeadId]
  );

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          lead.name.toLowerCase().includes(q) ||
          lead.company.toLowerCase().includes(q) ||
          lead.email.toLowerCase().includes(q) ||
          lead.role.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [leads, searchQuery, statusFilter]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredLeads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLeads.map((l) => l.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkStatus = (newStatus: LeadStatus) => {
    if (selectedIds.length === 0) return;
    bulkUpdateLeadStatus(selectedIds, newStatus);
    setSelectedIds([]);
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setEditName(lead.name);
    setEditCompany(lead.company);
    setEditRole(lead.role);
    setEditEmail(lead.email);
    setEditSource(lead.source);
    setEditIndustry(lead.industry);
    setEditSize(lead.companySize);
    setEditCountry(lead.country);
    setEditScore(lead.score);
    setEditNextAction(lead.nextAction);
    setEditNotes(lead.notes || '');
  };

  const handleSaveLeadEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead || !editName || !editCompany) return;

    updateLead(editingLead.id, {
      name: editName,
      company: editCompany,
      role: editRole,
      email: editEmail,
      source: editSource,
      industry: editIndustry,
      companySize: editSize,
      country: editCountry,
      score: Number(editScore),
      nextAction: editNextAction,
      notes: editNotes,
    });

    setEditingLead(null);
  };

  const handleConfirmConvert = () => {
    if (!convertingLead) return;
    convertLeadToContact(convertingLead.id, {
      createDeal: convertCreateDeal,
      dealValue: Number(convertDealValue),
      dealName: `${convertingLead.company} - Expansion Deployment`,
    });
    setConvertingLead(null);
    if (selectedLeadId === convertingLead.id) {
      setSelectedLeadId(null);
    }
  };

  const statusColors: Record<LeadStatus, string> = {
    new: 'text-blue-700 bg-blue-50',
    researching: 'text-amber-700 bg-amber-50',
    qualified: 'text-teal-700 bg-teal-50',
    contacted: 'text-indigo-700 bg-indigo-50',
    engaged: 'text-emerald-700 bg-emerald-50',
    disqualified: 'text-slate-500 bg-slate-100',
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Lead Qualification & Scoring</h2>
            <span className="text-xs text-slate-500 font-mono">
              ({filteredLeads.length} leads in queue)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent scoring criteria, qualification workflow, and inbound prioritization.
          </p>
        </div>

        <button
          onClick={() => openQuickCreate('lead')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs shadow-xs transition"
        >
          <Plus size={15} />
          <span>Qualify New Lead</span>
        </button>
      </div>

      {/* Filter Tabs & Bulk Actions */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
            {(['all', 'new', 'researching', 'qualified', 'contacted', 'engaged', 'disqualified'] as const).map(
              (st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg capitalize font-medium transition whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st === 'all' ? 'All Leads' : st}
                </button>
              )
            )}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads..."
              className="w-full pl-8 pr-3 py-1.5 text-xs text-slate-800 border border-slate-200 rounded-lg focus:outline-hidden focus:border-teal-500"
            />
          </div>
        </div>

        {/* Bulk Action Bar (when selected) */}
        {selectedIds.length > 0 && (
          <div className="p-2.5 bg-teal-50/70 border border-teal-200 rounded-lg flex items-center justify-between text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-teal-900 font-semibold">
              <CheckSquare size={14} className="text-teal-700" />
              <span>{selectedIds.length} lead{selectedIds.length === 1 ? '' : 's'} selected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-teal-800">Set status:</span>
              <button
                onClick={() => handleBulkStatus('contacted')}
                className="px-2.5 py-1 bg-white hover:bg-teal-100 border border-teal-300 rounded text-teal-800 font-medium transition"
              >
                Contacted
              </button>
              <button
                onClick={() => handleBulkStatus('engaged')}
                className="px-2.5 py-1 bg-white hover:bg-teal-100 border border-teal-300 rounded text-teal-800 font-medium transition"
              >
                Engaged
              </button>
              <button
                onClick={() => handleBulkStatus('qualified')}
                className="px-2.5 py-1 bg-white hover:bg-teal-100 border border-teal-300 rounded text-teal-800 font-medium transition"
              >
                Qualified
              </button>
              <button
                onClick={() => handleBulkStatus('disqualified')}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-600 font-medium transition"
              >
                Disqualified
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredLeads.length && filteredLeads.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                </th>
                <th className="py-3 px-3">Lead & Company</th>
                <th className="py-3 px-3">Score</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Source</th>
                <th className="py-3 px-3">Next Action</th>
                <th className="py-3 px-3">Owner</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No leads matching current filters.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLeadId(lead.id)}
                    className="hover:bg-slate-50/80 transition cursor-pointer group"
                  >
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(lead.id)}
                        onChange={() => toggleSelectOne(lead.id)}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                    </td>

                    {/* Name & Title */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 group-hover:text-teal-700 transition">
                        {lead.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {lead.role} · <span className="font-medium text-slate-700">{lead.company}</span>
                      </div>
                    </td>

                    {/* Score with breakdown click */}
                    <td className="py-3 px-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLeadForScoreModal(lead);
                        }}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-800 transition border border-slate-200"
                        title="Click to view transparent scoring calculation"
                      >
                        <Flame size={12} className={lead.score >= 80 ? 'text-amber-500' : 'text-slate-400'} />
                        <span>{lead.score}/100</span>
                        <HelpCircle size={10} className="text-slate-400" />
                      </button>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${statusColors[lead.status]}`}>
                        {lead.status}
                      </span>
                    </td>

                    {/* Source */}
                    <td className="py-3 px-3 text-slate-600">
                      {lead.source}
                    </td>

                    {/* Next Action */}
                    <td className="py-3 px-3 text-slate-700 font-medium max-w-xs truncate">
                      {lead.nextAction}
                    </td>

                    {/* Owner */}
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {lead.owner}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(lead);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          title="Edit lead"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLeadId(lead.id);
                          }}
                          className="text-xs font-semibold text-teal-600 hover:text-teal-800"
                        >
                          Qualify →
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transparent Lead Score Breakdown Modal */}
      {selectedLeadForScoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Transparent Lead Scoring</h3>
                <p className="text-xs text-slate-500">
                  {selectedLeadForScoreModal.name} ({selectedLeadForScoreModal.company})
                </p>
              </div>
              <button
                onClick={() => setSelectedLeadForScoreModal(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-teal-800 block uppercase">
                    Composite Qualification Score
                  </span>
                  <span className="text-xs text-teal-700">Calculated via deterministic B2B intent rules</span>
                </div>
                <span className="text-2xl font-bold font-mono text-teal-900">
                  {selectedLeadForScoreModal.score}/100
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <div>
                    <span className="font-semibold text-slate-800">Company Size Fit</span>
                    <span className="block text-[11px] text-slate-500">
                      Target segment ({selectedLeadForScoreModal.companySize} employees)
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    +{selectedLeadForScoreModal.scoreBreakdown.companySize} pts
                  </span>
                </div>

                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <div>
                    <span className="font-semibold text-slate-800">Job Title / Seniority Match</span>
                    <span className="block text-[11px] text-slate-500">
                      {selectedLeadForScoreModal.role} (Decision Authority)
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    +{selectedLeadForScoreModal.scoreBreakdown.titleMatch} pts
                  </span>
                </div>

                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <div>
                    <span className="font-semibold text-slate-800">Product Intent Signals</span>
                    <span className="block text-[11px] text-slate-500">
                      Source: {selectedLeadForScoreModal.source}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    +{selectedLeadForScoreModal.scoreBreakdown.productIntent} pts
                  </span>
                </div>

                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <div>
                    <span className="font-semibold text-slate-800">Recent Touchpoint Engagement</span>
                    <span className="block text-[11px] text-slate-500">
                      Email opens, clicks, or conference conversation
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    +{selectedLeadForScoreModal.scoreBreakdown.engagement} pts
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800">Estimated Budget Fit</span>
                    <span className="block text-[11px] text-slate-500">
                      Commercial viability vs ARR pricing baseline
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    +{selectedLeadForScoreModal.scoreBreakdown.budgetFit} pts
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedLeadForScoreModal(null)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Lead Detail Drawer */}
      {activeLead && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white shadow-2xl h-full flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{activeLead.name}</h3>
                <div className="text-xs text-slate-500">
                  {activeLead.role} · <span className="font-medium text-slate-800">{activeLead.company}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEditModal(activeLead)}
                  className="p-1.5 rounded-md text-slate-500 hover:text-teal-700 hover:bg-slate-100"
                  title="Edit lead"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => setConvertingLead(activeLead)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg text-xs transition shadow-2xs"
                  title="Convert to Contact & Opportunity"
                >
                  <ArrowRightCircle size={14} />
                  <span>Convert</span>
                </button>
                <button
                  onClick={() => deleteLead(activeLead.id)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                  title="Delete lead"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => setSelectedLeadId(null)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 ml-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
              {/* Qualification Progression Controls */}
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-2">
                  Update Qualification Stage
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(['new', 'researching', 'qualified', 'contacted', 'engaged', 'disqualified'] as LeadStatus[]).map(
                    (st) => (
                      <button
                        key={st}
                        onClick={() => updateLeadStatus(activeLead.id, st)}
                        className={`px-3 py-1.5 rounded-lg capitalize font-medium transition ${
                          activeLead.status === st
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Lead Details */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Email Address</span>
                  <span className="font-mono text-slate-800">{activeLead.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Source</span>
                  <span className="text-slate-800">{activeLead.source}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Industry</span>
                  <span className="text-slate-800">{activeLead.industry}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Company Size</span>
                  <span className="text-slate-800">{activeLead.companySize}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Owner</span>
                  <span className="text-slate-800 font-medium">{activeLead.owner}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Qualification Score</span>
                  <button
                    onClick={() => setSelectedLeadForScoreModal(activeLead)}
                    className="font-mono font-bold text-teal-700 hover:underline"
                  >
                    {activeLead.score}/100 (inspect)
                  </button>
                </div>
              </div>

              {/* Next Action */}
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                  Next Action Scheduled
                </span>
                <div className="p-3 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium">
                  {activeLead.nextAction}
                </div>
              </div>

              {/* Notes */}
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                  Lead Evaluation Notes
                </span>
                <p className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-600 leading-relaxed">
                  {activeLead.notes || 'No qualification notes recorded yet.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT LEAD MODAL */}
      {editingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Edit Lead Information</h3>
                <p className="text-xs text-slate-500">Update qualification criteria and company.</p>
              </div>
              <button
                onClick={() => setEditingLead(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveLeadEdit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Role / Title</label>
                  <input
                    type="text"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Source</label>
                  <select
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value as LeadSource)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="Inbound Website">Inbound Website</option>
                    <option value="Outbound SDR">Outbound SDR</option>
                    <option value="Referral">Referral</option>
                    <option value="Conference / Event">Conference / Event</option>
                    <option value="Product Signup">Product Signup</option>
                    <option value="Partner Ecosystem">Partner Ecosystem</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Lead Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editScore}
                    onChange={(e) => setEditScore(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Company Size</label>
                  <input
                    type="text"
                    value={editSize}
                    onChange={(e) => setEditSize(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Next Action</label>
                <input
                  type="text"
                  value={editNextAction}
                  onChange={(e) => setEditNextAction(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingLead(null)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONVERT LEAD CONFIRMATION MODAL */}
      {convertingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 p-5 text-xs">
            <div className="flex items-center gap-2.5 text-teal-700 mb-2 font-bold text-base">
              <ArrowRightCircle size={22} />
              <span>Convert Lead to Contact & Opportunity</span>
            </div>
            <p className="text-slate-600 leading-relaxed mb-4">
              Convert <strong>{convertingLead.name}</strong> ({convertingLead.company}) into an active CRM contact. Duplicate prevention will match existing accounts.
            </p>

            <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 mb-4">
              <label className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={convertCreateDeal}
                  onChange={(e) => setConvertCreateDeal(e.target.checked)}
                  className="rounded text-teal-600 border-slate-300 focus:ring-teal-500"
                />
                <span>Also create active Sales Pipeline Opportunity</span>
              </label>

              {convertCreateDeal && (
                <div>
                  <span className="block text-[11px] text-slate-500 mb-1 font-medium">Estimated Deal Value (USD)</span>
                  <input
                    type="number"
                    value={convertDealValue}
                    onChange={(e) => setConvertDealValue(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono text-xs"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConvertingLead(null)}
                className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmConvert}
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-xs transition"
              >
                Confirm Conversion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
