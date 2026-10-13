import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Building,
  Calendar,
  X,
  FileText,
  Clock,
  ArrowUpDown,
  Archive,
  Trash2,
  Edit2,
  ExternalLink,
  Briefcase,
  CheckCircle2,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Contact, LifecycleStage, LeadSource } from '../../types/crm';

export const ContactsView: React.FC = () => {
  const {
    contacts,
    companies,
    deals,
    activities,
    selectedContactId,
    setSelectedContactId,
    openQuickCreate,
    updateContact,
    deleteContact,
    archiveContact,
    logActivity,
    setCurrentTab,
    setSelectedDealId,
  } = useCRM();

  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'name' | 'companyName' | 'lastActivityAt'>('lastActivityAt');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // New Note state in Drawer
  const [newNoteText, setNewNoteText] = useState('');

  // Edit Contact Modal State
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editCompanyId, setEditCompanyId] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editStage, setEditStage] = useState<LifecycleStage>('opportunity');
  const [editSource, setEditSource] = useState<LeadSource>('Inbound Website');
  const [editOwner, setEditOwner] = useState('Alex Morgan');

  // Selected contact object
  const activeContact = useMemo(
    () => contacts.find((c) => c.id === selectedContactId) || null,
    [contacts, selectedContactId]
  );

  // Filtered & Sorted Contacts
  const filteredContacts = useMemo(() => {
    return contacts
      .filter((c) => {
        if (c.isArchived) return false;
        if (stageFilter !== 'all' && c.lifecycleStage !== stageFilter) return false;
        if (sourceFilter !== 'all' && c.leadSource !== sourceFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.companyName.toLowerCase().includes(q) ||
            c.role.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (sortAsc) return valA > valB ? 1 : -1;
        return valA < valB ? 1 : -1;
      });
  }, [contacts, searchQuery, stageFilter, sourceFilter, sortField, sortAsc]);

  // Associated deals for active contact
  const activeContactDeals = useMemo(() => {
    if (!activeContact) return [];
    return deals.filter((d) => d.contactId === activeContact.id || d.companyId === activeContact.companyId);
  }, [activeContact, deals]);

  // Associated activities
  const activeContactActivities = useMemo(() => {
    if (!activeContact) return [];
    return activities.filter(
      (a) => a.relatedTo.id === activeContact.id || a.relatedTo.name.includes(activeContact.name)
    );
  }, [activeContact, activities]);

  const handleAddNote = () => {
    if (!newNoteText.trim() || !activeContact) return;
    logActivity({
      type: 'note',
      title: 'Note Added to Contact',
      description: newNoteText,
      relatedTo: { type: 'contact', id: activeContact.id, name: activeContact.name },
      performedBy: 'Alex Morgan',
    });
    updateContact(activeContact.id, { notesCount: (activeContact.notesCount || 0) + 1 });
    setNewNoteText('');
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setEditName(contact.name);
    setEditEmail(contact.email);
    setEditPhone(contact.phone);
    setEditRole(contact.role);
    setEditCompanyId(contact.companyId);
    setEditCountry(contact.country);
    setEditStage(contact.lifecycleStage);
    setEditSource(contact.leadSource);
    setEditOwner(contact.owner);
  };

  const handleSaveContactEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact || !editName || !editEmail) return;

    const comp = companies.find((c) => c.id === editCompanyId);

    updateContact(editingContact.id, {
      name: editName,
      email: editEmail,
      phone: editPhone,
      role: editRole,
      companyId: editCompanyId,
      companyName: comp ? comp.name : editingContact.companyName,
      country: editCountry,
      lifecycleStage: editStage,
      leadSource: editSource,
      owner: editOwner,
    });

    setEditingContact(null);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Contacts Directory</h2>
            <span className="text-xs text-slate-500 font-mono">
              ({filteredContacts.length} of {contacts.length} total)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage relationships, decision makers, and communication logs.
          </p>
        </div>

        <button
          onClick={() => openQuickCreate('contact')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs shadow-xs transition"
        >
          <Plus size={15} />
          <span>Add New Contact</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, role, email, or company..."
            className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 border border-slate-200 rounded-lg focus:outline-hidden focus:border-teal-500"
          />
        </div>

        {/* Stage Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 shrink-0">Stage:</span>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium capitalize"
          >
            <option value="all">All Stages</option>
            <option value="lead">Lead</option>
            <option value="mql">MQL</option>
            <option value="sql">SQL</option>
            <option value="opportunity">Opportunity</option>
            <option value="customer">Customer</option>
          </select>
        </div>

        {/* Source Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 shrink-0">Source:</span>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium"
          >
            <option value="all">All Sources</option>
            <option value="Inbound Website">Inbound Website</option>
            <option value="Outbound SDR">Outbound SDR</option>
            <option value="Referral">Referral</option>
            <option value="Conference / Event">Conference / Event</option>
            <option value="Product Signup">Product Signup</option>
            <option value="Partner Ecosystem">Partner Ecosystem</option>
          </select>
        </div>

        {/* Sort Field */}
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-medium transition"
        >
          <ArrowUpDown size={13} className="text-slate-400" />
          <span>Sort {sortAsc ? 'Asc' : 'Desc'}</span>
        </button>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Lifecycle Stage</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No contacts matching current search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    onClick={() => setSelectedContactId(contact.id)}
                    className="hover:bg-slate-50/80 transition cursor-pointer group"
                  >
                    {/* Name & Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-semibold text-slate-700 text-xs shrink-0 group-hover:border-teal-500 transition">
                          {contact.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 group-hover:text-teal-700 transition">
                            {contact.name}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>{contact.role}</span>
                            <span>·</span>
                            <span>{contact.country}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Company */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{contact.companyName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{contact.email}</div>
                    </td>

                    {/* Lifecycle stage */}
                    <td className="py-3.5 px-4">
                      <span className="font-medium capitalize text-slate-700">
                        {contact.lifecycleStage}
                      </span>
                    </td>

                    {/* Source */}
                    <td className="py-3.5 px-4 text-slate-600">
                      {contact.leadSource}
                    </td>

                    {/* Owner */}
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {contact.owner}
                    </td>

                    {/* Last activity */}
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(contact.lastActivityAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(contact);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          title="Edit contact"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedContactId(contact.id);
                          }}
                          className="text-xs font-semibold text-teal-600 hover:text-teal-800"
                        >
                          Profile →
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

      {/* Slide-over Profile Drawer */}
      {activeContact && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white shadow-2xl h-full flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-2xs">
                  {activeContact.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{activeContact.name}</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>{activeContact.role}</span>
                    <span>·</span>
                    <span className="font-medium text-slate-700">{activeContact.companyName}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEditModal(activeContact)}
                  className="p-1.5 rounded-md text-slate-500 hover:text-teal-700 hover:bg-slate-100 transition"
                  title="Edit contact details"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => archiveContact(activeContact.id)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  title="Archive contact"
                >
                  <Archive size={16} />
                </button>
                <button
                  onClick={() => deleteContact(activeContact.id)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                  title="Delete contact"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => setSelectedContactId(null)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 ml-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
              {/* Quick Contact Actions Bar */}
              <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                <a
                  href={`mailto:${activeContact.email}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition"
                >
                  <Mail size={13} className="text-teal-600" />
                  <span>Send Email</span>
                </a>
                <a
                  href={`tel:${activeContact.phone}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition"
                >
                  <Phone size={13} className="text-slate-500" />
                  <span>Call Phone</span>
                </a>
                <button
                  onClick={() => openQuickCreate('activity')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-medium transition"
                >
                  <Calendar size={13} />
                  <span>Log Activity</span>
                </button>
              </div>

              {/* Record Properties */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 text-xs uppercase tracking-wider text-slate-400">
                  Contact Details
                </h4>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Email Address</span>
                    <span className="font-mono text-slate-800">{activeContact.email}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Phone Number</span>
                    <span className="font-mono text-slate-800">{activeContact.phone}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Location</span>
                    <span className="text-slate-800">{activeContact.country}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Lifecycle Stage</span>
                    <span className="capitalize font-semibold text-teal-700">{activeContact.lifecycleStage}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Lead Source</span>
                    <span className="text-slate-800">{activeContact.leadSource}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Account Owner</span>
                    <span className="text-slate-800 font-medium">{activeContact.owner}</span>
                  </div>
                </div>
              </div>

              {/* Associated Opportunities */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
                    Associated Opportunities ({activeContactDeals.length})
                  </h4>
                  <button
                    onClick={() => openQuickCreate('deal')}
                    className="text-[11px] font-semibold text-teal-600 hover:text-teal-700"
                  >
                    + Add Deal
                  </button>
                </div>

                {activeContactDeals.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400 text-xs">
                    No active deals associated with this contact.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeContactDeals.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => {
                          setCurrentTab('deals');
                          setSelectedDealId(d.id);
                        }}
                        className="p-3 bg-white border border-slate-200 rounded-lg hover:border-teal-500 cursor-pointer transition flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-slate-800">{d.name}</div>
                          <div className="text-[11px] text-slate-400">
                            Stage: <span className="capitalize text-slate-700 font-medium">{d.stage}</span> · {d.probability}% prob
                          </div>
                        </div>
                        <span className="font-mono font-bold text-slate-900">
                          ${d.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Note Section */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-2 text-xs uppercase tracking-wider text-slate-400">
                  Add Internal Note
                </h4>
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Log feedback, procurement update, or call summary..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-teal-500"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddNote}
                      disabled={!newNoteText.trim()}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg font-medium text-xs transition"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              </div>

              {/* Activity History */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 text-xs uppercase tracking-wider text-slate-400">
                  Activity Timeline ({activeContactActivities.length})
                </h4>
                {activeContactActivities.length === 0 ? (
                  <div className="text-slate-400 text-center py-4">No logged history yet.</div>
                ) : (
                  <div className="space-y-3">
                    {activeContactActivities.map((act) => (
                      <div key={act.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex items-center justify-between font-semibold text-slate-800">
                          <span>{act.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(act.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1 leading-relaxed">{act.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CONTACT MODAL */}
      {editingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Edit Contact Profile</h3>
                <p className="text-xs text-slate-500">Update contact information and association.</p>
              </div>
              <button
                onClick={() => setEditingContact(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveContactEdit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Role / Job Title</label>
                  <input
                    type="text"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Company</label>
                  <select
                    value={editCompanyId}
                    onChange={(e) => setEditCompanyId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={editCountry}
                    onChange={(e) => setEditCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Lifecycle Stage</label>
                  <select
                    value={editStage}
                    onChange={(e) => setEditStage(e.target.value as LifecycleStage)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white capitalize"
                  >
                    <option value="lead">Lead</option>
                    <option value="mql">MQL</option>
                    <option value="sql">SQL</option>
                    <option value="opportunity">Opportunity</option>
                    <option value="customer">Customer</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Lead Source</label>
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
                  <label className="block font-medium text-slate-700 mb-1">Account Owner</label>
                  <input
                    type="text"
                    value={editOwner}
                    onChange={(e) => setEditOwner(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingContact(null)}
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
    </div>
  );
};
