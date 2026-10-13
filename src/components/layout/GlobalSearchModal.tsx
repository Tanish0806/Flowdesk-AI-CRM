import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Building, Briefcase, UserCheck, X, ArrowRight } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';

export const GlobalSearchModal: React.FC = () => {
  const {
    searchModalOpen,
    setSearchModalOpen,
    globalSearch,
    setCurrentTab,
    setSelectedContactId,
    setSelectedCompanyId,
    setSelectedLeadId,
    setSelectedDealId,
  } = useCRM();

  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'contact' | 'deal' | 'company' | 'lead'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
      if (e.key === 'Escape' && searchModalOpen) {
        setSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchModalOpen, setSearchModalOpen]);

  // Auto-focus on open
  useEffect(() => {
    if (searchModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [searchModalOpen]);

  if (!searchModalOpen) return null;

  const rawResults = globalSearch(query);
  const filteredResults = filterType === 'all' ? rawResults : rawResults.filter((r) => r.type === filterType);

  const handleSelect = (item: { id: string; type: 'contact' | 'company' | 'deal' | 'lead' }) => {
    setSearchModalOpen(false);
    if (item.type === 'contact') {
      setCurrentTab('contacts');
      setSelectedContactId(item.id);
    } else if (item.type === 'company') {
      setCurrentTab('companies');
      setSelectedCompanyId(item.id);
    } else if (item.type === 'deal') {
      setCurrentTab('deals');
      setSelectedDealId(item.id);
    } else if (item.type === 'lead') {
      setCurrentTab('leads');
      setSelectedLeadId(item.id);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'contact':
        return <User size={15} className="text-teal-600" />;
      case 'deal':
        return <Briefcase size={15} className="text-amber-600" />;
      case 'company':
        return <Building size={15} className="text-blue-600" />;
      case 'lead':
        return <UserCheck size={15} className="text-cyan-600" />;
      default:
        return <Search size={15} className="text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200">
          <Search size={18} className="text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search across contacts, companies, deals, and leads..."
            className="w-full text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden bg-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={16} />
            </button>
          )}
          <button
            onClick={() => setSearchModalOpen(false)}
            className="text-xs text-slate-400 hover:text-slate-600 ml-2 px-1.5 py-0.5 border border-slate-200 rounded font-mono"
          >
            ESC
          </button>
        </div>

        {/* Filter Categories */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-50/80 border-b border-slate-200 text-xs text-slate-600">
          {(['all', 'contact', 'deal', 'company', 'lead'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 rounded-md capitalize transition font-medium ${
                filterType === type
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {type === 'all' ? 'All Results' : `${type}s`}
            </button>
          ))}
        </div>

        {/* Results list */}
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2">
          {query.trim() === '' ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Start typing to search records, or use navigation tabs above.
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching records found for "{query}".
            </div>
          ) : (
            filteredResults.map((item) => (
              <div
                key={item.type + '-' + item.id}
                onClick={() => handleSelect(item)}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-white border border-slate-200/80 transition shrink-0">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                        · {item.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-3 shrink-0">
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    {item.meta}
                  </span>
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-teal-600 transition" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Keyboard footer tip */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <span>Search index updated live from local CRM data</span>
          <span>Press ESC to dismiss</span>
        </div>
      </div>
    </div>
  );
};
