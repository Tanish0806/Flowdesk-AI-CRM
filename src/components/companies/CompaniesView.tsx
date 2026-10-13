import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Plus,
  Globe,
  MapPin,
  Users,
  Briefcase,
  DollarSign,
  X,
  ExternalLink,
  Trash2,
  Calendar,
  Edit2,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Company } from '../../types/crm';

export const CompaniesView: React.FC = () => {
  const {
    companies,
    contacts,
    deals,
    activities,
    selectedCompanyId,
    setSelectedCompanyId,
    openQuickCreate,
    updateCompany,
    deleteCompany,
    setCurrentTab,
    setSelectedContactId,
    setSelectedDealId,
  } = useCRM();

  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState<string>('all');

  // Edit Company State
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editName, setEditName] = useState('');
  const [editDomain, setEditDomain] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editSize, setEditSize] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editAbout, setEditAbout] = useState('');

  const activeCompany = useMemo(
    () => companies.find((c) => c.id === selectedCompanyId) || null,
    [companies, selectedCompanyId]
  );

  const filteredCompanies = useMemo(() => {
    return companies.filter((comp) => {
      if (industryFilter !== 'all' && comp.industry !== industryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          comp.name.toLowerCase().includes(q) ||
          comp.domain.toLowerCase().includes(q) ||
          comp.location.toLowerCase().includes(q) ||
          comp.industry.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [companies, searchQuery, industryFilter]);

  const activeCompanyContacts = useMemo(() => {
    if (!activeCompany) return [];
    return contacts.filter((c) => c.companyId === activeCompany.id);
  }, [activeCompany, contacts]);

  const activeCompanyDeals = useMemo(() => {
    if (!activeCompany) return [];
    return deals.filter((d) => d.companyId === activeCompany.id);
  }, [activeCompany, deals]);

  const industries = Array.from(new Set(companies.map((c) => c.industry)));

  const openEditModal = (comp: Company) => {
    setEditingCompany(comp);
    setEditName(comp.name);
    setEditDomain(comp.domain);
    setEditIndustry(comp.industry);
    setEditSize(comp.size);
    setEditLocation(comp.location);
    setEditAbout(comp.about);
  };

  const handleSaveCompanyEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany || !editName) return;

    updateCompany(editingCompany.id, {
      name: editName,
      domain: editDomain,
      industry: editIndustry,
      size: editSize,
      location: editLocation,
      about: editAbout,
    });

    setEditingCompany(null);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Companies & Accounts</h2>
            <span className="text-xs text-slate-500 font-mono">
              ({filteredCompanies.length} accounts)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Enterprise customer organizations and accounts under evaluation.
          </p>
        </div>

        <button
          onClick={() => openQuickCreate('company')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs shadow-xs transition"
        >
          <Plus size={15} />
          <span>Add Company</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company name, domain, industry, location..."
            className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 border border-slate-200 rounded-lg focus:outline-hidden focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500">Industry:</span>
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium"
          >
            <option value="all">All Industries</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCompanies.map((comp) => {
          const compDeals = deals.filter((d) => d.companyId === comp.id);
          const totalVal = compDeals.reduce((sum, d) => sum + d.value, 0);

          return (
            <div
              key={comp.id}
              onClick={() => setSelectedCompanyId(comp.id)}
              className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg ${comp.logoBg} text-white font-bold flex items-center justify-center text-sm shadow-2xs`}>
                      {comp.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition">
                        {comp.name}
                      </h3>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Globe size={11} className="text-slate-400" />
                        {comp.domain}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(comp);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                    title="Edit company"
                  >
                    <Edit2 size={13} />
                  </button>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mt-3 leading-relaxed">
                  {comp.about}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Industry</span>
                    <span className="font-medium text-slate-800 truncate block">{comp.industry}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Headquarters</span>
                    <span className="text-slate-800 truncate block">{comp.location}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
                  <span>{comp.employeeCount} team</span>
                  <span>·</span>
                  <span>{compDeals.length} deals</span>
                </div>
                <div className="font-mono font-bold text-slate-900 text-xs">
                  ${totalVal.toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide-over Company Profile Drawer */}
      {activeCompany && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white shadow-2xl h-full flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className={`h-11 w-11 rounded-lg ${activeCompany.logoBg} text-white font-bold flex items-center justify-center text-sm shadow-2xs`}>
                  {activeCompany.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{activeCompany.name}</h3>
                  <a
                    href={`https://${activeCompany.domain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-teal-600 hover:underline flex items-center gap-1"
                  >
                    <span>{activeCompany.domain}</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEditModal(activeCompany)}
                  className="p-1.5 rounded-md text-slate-500 hover:text-teal-700 hover:bg-slate-100"
                  title="Edit company"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => deleteCompany(activeCompany.id)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                  title="Delete company"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => setSelectedCompanyId(null)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2 text-xs uppercase tracking-wider text-slate-400">
                  Company Overview
                </h4>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                  {activeCompany.about}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Industry</span>
                  <span className="font-semibold text-slate-800">{activeCompany.industry}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Team Size</span>
                  <span className="font-semibold text-slate-800">{activeCompany.employeeCount} employees</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Location</span>
                  <span className="font-semibold text-slate-800">{activeCompany.location}</span>
                </div>
              </div>

              {/* Linked Contacts */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
                    Associated Contacts ({activeCompanyContacts.length})
                  </h4>
                  <button
                    onClick={() => openQuickCreate('contact')}
                    className="text-[11px] font-semibold text-teal-600 hover:text-teal-700"
                  >
                    + Add Contact
                  </button>
                </div>

                {activeCompanyContacts.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400 text-xs">
                    No contacts linked to this company yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeCompanyContacts.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedCompanyId(null);
                          setCurrentTab('contacts');
                          setSelectedContactId(c.id);
                        }}
                        className="p-3 bg-white border border-slate-200 rounded-lg hover:border-teal-500 cursor-pointer transition flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-slate-100 font-semibold flex items-center justify-center text-[11px] text-slate-700">
                            {c.name[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{c.name}</div>
                            <div className="text-[11px] text-slate-400">{c.role} · {c.email}</div>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-teal-600">View →</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Linked Deals */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
                    Open & Closed Deals ({activeCompanyDeals.length})
                  </h4>
                  <button
                    onClick={() => openQuickCreate('deal')}
                    className="text-[11px] font-semibold text-teal-600 hover:text-teal-700"
                  >
                    + New Deal
                  </button>
                </div>

                {activeCompanyDeals.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400 text-xs">
                    No deals created for this company.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeCompanyDeals.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => {
                          setSelectedCompanyId(null);
                          setCurrentTab('deals');
                          setSelectedDealId(d.id);
                        }}
                        className="p-3 bg-white border border-slate-200 rounded-lg hover:border-teal-500 cursor-pointer transition flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-slate-800">{d.name}</div>
                          <div className="text-[11px] text-slate-400">
                            Stage: <span className="capitalize text-slate-700 font-semibold">{d.stage}</span> · {d.probability}% prob
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
            </div>
          </div>
        </div>
      )}

      {/* EDIT COMPANY MODAL */}
      {editingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Edit Company Profile</h3>
                <p className="text-xs text-slate-500">Update company metadata and headquarters.</p>
              </div>
              <button
                onClick={() => setEditingCompany(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCompanyEdit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Website Domain</label>
                  <input
                    type="text"
                    value={editDomain}
                    onChange={(e) => setEditDomain(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Industry</label>
                  <input
                    type="text"
                    value={editIndustry}
                    onChange={(e) => setEditIndustry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Employee Count</label>
                  <input
                    type="text"
                    value={editSize}
                    onChange={(e) => setEditSize(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">About Company</label>
                <textarea
                  rows={3}
                  value={editAbout}
                  onChange={(e) => setEditAbout(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCompany(null)}
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
