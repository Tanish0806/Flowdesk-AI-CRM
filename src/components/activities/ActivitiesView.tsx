import React, { useState, useMemo } from 'react';
import {
  Activity as ActivityIcon,
  Mail,
  Phone,
  Calendar,
  FileText,
  TrendingUp,
  CheckCircle2,
  Plus,
  Search,
  Filter,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { ActivityType } from '../../types/crm';

export const ActivitiesView: React.FC = () => {
  const { activities, openQuickCreate } = useCRM();

  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (typeFilter !== 'all' && act.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          act.title.toLowerCase().includes(q) ||
          act.description.toLowerCase().includes(q) ||
          act.relatedTo.name.toLowerCase().includes(q) ||
          act.performedBy.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activities, typeFilter, searchQuery]);

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'meeting':
        return <Calendar size={15} className="text-blue-600" />;
      case 'email':
        return <Mail size={15} className="text-teal-600" />;
      case 'call':
        return <Phone size={15} className="text-cyan-600" />;
      case 'stage_change':
        return <TrendingUp size={15} className="text-emerald-600" />;
      case 'note':
        return <FileText size={15} className="text-slate-500" />;
      default:
        return <CheckCircle2 size={15} className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Activities & Engagement Log</h2>
            <span className="text-xs text-slate-500 font-mono">
              ({filteredActivities.length} total entries)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of communications, milestones, customer meetings, and status changes.
          </p>
        </div>

        <button
          onClick={() => openQuickCreate('activity')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs shadow-xs transition"
        >
          <Plus size={15} />
          <span>Log New Activity</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs w-full sm:w-auto">
          {(['all', 'meeting', 'email', 'call', 'note', 'stage_change'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg capitalize font-medium transition whitespace-nowrap ${
                typeFilter === t
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t === 'all' ? 'All Activities' : t.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activities..."
            className="w-full pl-8 pr-3 py-1.5 text-xs text-slate-800 border border-slate-200 rounded-lg focus:outline-hidden focus:border-teal-500"
          />
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5">
        <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
          {filteredActivities.length === 0 ? (
            <div className="py-8 pl-6 text-slate-400 text-xs">No matching activities found.</div>
          ) : (
            filteredActivities.map((act) => (
              <div key={act.id} className="relative pl-6 text-xs group">
                {/* Dot */}
                <div className="absolute -left-[17px] top-1 p-1 rounded-full bg-white border-2 border-teal-600 shadow-2xs group-hover:scale-110 transition">
                  {getActivityIcon(act.type)}
                </div>

                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/70 hover:border-slate-300 transition">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                      {act.title}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(act.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-slate-600 mt-1.5 leading-relaxed text-xs">
                    {act.description}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span>Logged by <strong className="text-slate-700">{act.performedBy}</strong></span>
                      <span>·</span>
                      <span className="text-teal-700 font-semibold">{act.relatedTo.name}</span>
                    </div>
                    <span className="capitalize font-mono text-[10px] text-slate-400 uppercase">
                      {act.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
