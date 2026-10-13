import React, { useState, useMemo } from 'react';
import {
  Kanban,
  Table as TableIcon,
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Award,
  AlertCircle,
  MoreVertical,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Calendar,
  Building,
  User,
  Edit2,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Deal, DealStage, TaskPriority, LostReasonCategory } from '../../types/crm';

export const DealsPipelineView: React.FC = () => {
  const {
    currentTab,
    deals,
    companies,
    contacts,
    selectedDealId,
    setSelectedDealId,
    moveDealStage,
    markDealWon,
    markDealLost,
    deleteDeal,
    updateDeal,
    openQuickCreate,
    logActivity,
  } = useCRM();

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Automatically adapt view mode based on navigation tab selection
  React.useEffect(() => {
    if (currentTab === 'deals') {
      setViewMode('table');
    } else if (currentTab === 'pipeline') {
      setViewMode('kanban');
    }
  }, [currentTab]);
  const [searchQuery, setSearchQuery] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [minValFilter, setMinValFilter] = useState('all');

  // Confirmation Modals for Won / Lost
  const [dealToWin, setDealToWin] = useState<Deal | null>(null);
  const [winRecordedCost, setWinRecordedCost] = useState<string>('');
  const [dealToLose, setDealToLose] = useState<Deal | null>(null);
  const [lostReasonCategory, setLostReasonCategory] = useState<LostReasonCategory>('Budget Constraints');
  const [customLostReason, setCustomLostReason] = useState<string>('');

  // Edit Deal Modal State
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [editDealName, setEditDealName] = useState('');
  const [editDealValue, setEditDealValue] = useState<number>(0);
  const [editDealCost, setEditDealCost] = useState<string>('');
  const [editDealLostReason, setEditDealLostReason] = useState<string>('Budget Constraints');
  const [editDealProb, setEditDealProb] = useState<number>(50);
  const [editDealStage, setEditDealStage] = useState<DealStage>('qualified');
  const [editDealCloseDate, setEditDealCloseDate] = useState('');
  const [editDealOwner, setEditDealOwner] = useState('Alex Morgan');
  const [editDealPriority, setEditDealPriority] = useState<TaskPriority>('medium');
  const [editDealNotes, setEditDealNotes] = useState('');

  // Drag-and-drop state
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);

  const STAGES: { stage: DealStage; label: string; color: string }[] = [
    { stage: 'new', label: 'New Opportunity', color: 'border-slate-300' },
    { stage: 'qualified', label: 'Qualified', color: 'border-blue-400' },
    { stage: 'discovery', label: 'Discovery', color: 'border-cyan-400' },
    { stage: 'proposal', label: 'Proposal', color: 'border-amber-400' },
    { stage: 'negotiation', label: 'Negotiation', color: 'border-teal-500' },
    { stage: 'won', label: 'Closed Won', color: 'border-emerald-500' },
    { stage: 'lost', label: 'Closed Lost', color: 'border-rose-400' },
  ];

  const activeDeal = useMemo(
    () => deals.find((d) => d.id === selectedDealId) || null,
    [deals, selectedDealId]
  );

  // Filtered Deals
  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      if (ownerFilter !== 'all' && d.owner !== ownerFilter) return false;
      if (minValFilter === '50k' && d.value < 50000) return false;
      if (minValFilter === '100k' && d.value < 100000) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          d.name.toLowerCase().includes(q) ||
          d.companyName.toLowerCase().includes(q) ||
          d.contactName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [deals, ownerFilter, minValFilter, searchQuery]);

  // Aggregate Pipeline Metrics calculated directly from filtered records
  const pipelineMetrics = useMemo(() => {
    const openDeals = filteredDeals.filter((d) => d.stage !== 'lost' && d.stage !== 'won');
    const totalPipeline = openDeals.reduce((sum, d) => sum + d.value, 0);
    const weightedPipeline = openDeals.reduce(
      (sum, d) => sum + Math.round((d.value * (d.probability / 100))),
      0
    );
    const wonTotal = filteredDeals.filter((d) => d.stage === 'won').reduce((s, d) => s + d.value, 0);

    return {
      totalPipeline,
      weightedPipeline,
      openCount: openDeals.length,
      wonTotal,
    };
  }, [filteredDeals]);

  const uniqueOwners = Array.from(new Set(deals.map((d) => d.owner)));

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('text/plain', dealId);
    setDraggedDealId(dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStage: DealStage) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain') || draggedDealId;
    if (dealId) {
      if (targetStage === 'won') {
        const target = deals.find((d) => d.id === dealId);
        if (target) setDealToWin(target);
      } else if (targetStage === 'lost') {
        const target = deals.find((d) => d.id === dealId);
        if (target) setDealToLose(target);
      } else {
        moveDealStage(dealId, targetStage);
      }
    }
    setDraggedDealId(null);
  };

  const openEditDealModal = (deal: Deal) => {
    setEditingDeal(deal);
    setEditDealName(deal.name);
    setEditDealValue(deal.value);
    setEditDealCost(deal.cost !== undefined ? String(deal.cost) : '');
    setEditDealLostReason(deal.lostReason || 'Budget Constraints');
    setEditDealProb(deal.probability);
    setEditDealStage(deal.stage);
    setEditDealCloseDate(deal.expectedCloseDate);
    setEditDealOwner(deal.owner);
    setEditDealPriority(deal.priority);
    setEditDealNotes(deal.notes || '');
  };

  const handleSaveDealEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeal || !editDealName) return;

    updateDeal(editingDeal.id, {
      name: editDealName,
      value: Number(editDealValue) || 0,
      cost: editDealCost.trim() ? Number(editDealCost) : undefined,
      lostReason: editDealStage === 'lost' ? editDealLostReason : undefined,
      probability: Number(editDealProb) || 0,
      stage: editDealStage,
      expectedCloseDate: editDealCloseDate,
      owner: editDealOwner,
      priority: editDealPriority,
      notes: editDealNotes,
    });

    setEditingDeal(null);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Pipeline Summary Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sales Pipeline & Deals</h2>
            <span className="text-xs text-slate-500 font-mono">
              ({deals.length} opportunities)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full lifecycle stage tracking with weighted projections and velocity monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban size={13} />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon size={13} />
              <span>Table</span>
            </button>
          </div>

          <button
            onClick={() => openQuickCreate('deal')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs shadow-xs transition"
          >
            <Plus size={15} />
            <span>New Deal</span>
          </button>
        </div>
      </div>

      {/* Aggregate Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Unweighted Pipeline</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
            ${pipelineMetrics.totalPipeline.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">{pipelineMetrics.openCount} open deals</span>
        </div>

        <div>
          <span className="text-[11px] text-teal-600 uppercase font-semibold">Weighted Projection</span>
          <div className="text-xl font-bold font-mono text-teal-700 mt-0.5">
            ${pipelineMetrics.weightedPipeline.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Value × Probability</span>
        </div>

        <div>
          <span className="text-[11px] text-emerald-600 uppercase font-semibold">Closed Won</span>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-0.5">
            ${pipelineMetrics.wonTotal.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Recognized contract value</span>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Average Won Deal Size</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
            ${deals.filter((d) => d.stage === 'won').length > 0
              ? Math.round(deals.filter((d) => d.stage === 'won').reduce((s, d) => s + d.value, 0) / deals.filter((d) => d.stage === 'won').length).toLocaleString()
              : '—'}
          </div>
          <span className="text-[10px] text-slate-500">From won contracts</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deals by title, company, or contact..."
            className="w-full pl-8 pr-3 py-1.5 text-xs text-slate-800 border border-slate-200 rounded-lg focus:outline-hidden focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Owner:</span>
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium"
            >
              <option value="all">All Reps</option>
              {uniqueOwners.map((owner) => (
                <option key={owner} value={owner}>{owner}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Size:</span>
            <select
              value={minValFilter}
              onChange={(e) => setMinValFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium"
            >
              <option value="all">All Values</option>
              <option value="50k">&gt; $50k</option>
              <option value="100k">&gt; $100k</option>
            </select>
          </div>
        </div>
      </div>

      {/* KANBAN PIPELINE VIEW */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-3 items-start overflow-x-auto pb-4">
          {STAGES.map((col) => {
            const colDeals = filteredDeals.filter((d) => d.stage === col.stage);
            const colTotal = colDeals.reduce((sum, d) => sum + d.value, 0);

            return (
              <div
                key={col.stage}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.stage)}
                className="bg-slate-100/70 rounded-xl p-2.5 border border-slate-200/80 flex flex-col min-w-[220px]"
              >
                {/* Column Header */}
                <div className="pb-2.5 mb-2 border-b border-slate-200/80 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-xs text-slate-800">{col.label}</h3>
                    <span className="font-mono text-[11px] text-slate-500">
                      ${colTotal.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold text-slate-600">
                    {colDeals.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-2.5 min-h-[140px]">
                  {colDeals.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-lg">
                      Drop deals here
                    </div>
                  ) : (
                    colDeals.map((deal) => (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, deal.id)}
                        onClick={() => setSelectedDealId(deal.id)}
                        className={`bg-white p-3 rounded-lg border border-slate-200 shadow-2xs hover:shadow-xs hover:border-teal-500 transition cursor-grab active:cursor-grabbing group relative ${
                          deal.daysInStage >= 14 && deal.stage !== 'won' && deal.stage !== 'lost'
                            ? 'ring-1 ring-amber-400'
                            : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-semibold text-xs text-slate-900 group-hover:text-teal-700 transition leading-snug line-clamp-2">
                            {deal.name}
                          </h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDealModal(deal);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition shrink-0"
                            title="Edit deal value & details"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>

                        <div className="text-[11px] text-slate-500 mt-1 truncate">
                          {deal.companyName}
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            ${deal.value.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {deal.probability}%
                          </span>
                        </div>

                        {/* Owner & Velocity Warning */}
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>{deal.owner}</span>
                          <span
                            className={deal.daysInStage >= 14 ? 'text-amber-600 font-semibold' : ''}
                          >
                            {deal.daysInStage}d in stage
                          </span>
                        </div>

                        {/* Quick Stage Advance Action */}
                        <div className="mt-2 pt-1.5 border-t border-slate-50 flex items-center justify-between text-[10px]">
                          {col.stage !== 'won' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDealToWin(deal);
                              }}
                              className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-0.5"
                            >
                              <CheckCircle2 size={11} /> Win
                            </button>
                          )}
                          {col.stage !== 'lost' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDealToLose(deal);
                              }}
                              className="text-slate-400 hover:text-rose-600 font-medium flex items-center gap-0.5"
                            >
                              <XCircle size={11} /> Lost
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDealId(deal.id);
                            }}
                            className="text-teal-600 hover:underline font-semibold ml-auto"
                          >
                            Details →
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Deal Name</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Value</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Probability</th>
                  <th className="py-3 px-4">Close Date</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDeals.map((deal) => (
                  <tr
                    key={deal.id}
                    onClick={() => setSelectedDealId(deal.id)}
                    className="hover:bg-slate-50/80 transition cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900 group-hover:text-teal-700">
                      {deal.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {deal.companyName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {deal.contactName}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      ${deal.value.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize font-semibold text-slate-700">
                        {deal.stage}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {deal.probability}%
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {deal.expectedCloseDate}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {deal.owner}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDealModal(deal);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                          title="Edit deal"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDealId(deal.id);
                          }}
                          className="text-xs font-semibold text-teal-600 hover:text-teal-800"
                        >
                          Inspect →
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Win Deal Confirmation Modal */}
      {dealToWin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 p-5">
            <div className="flex items-center gap-3 text-emerald-600 mb-3">
              <Award size={24} />
              <h3 className="font-bold text-slate-900 text-base">Confirm Closed Won</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Are you sure you want to mark <strong>"{dealToWin.name}"</strong> as Closed Won for{' '}
              <strong className="text-slate-900">${dealToWin.value.toLocaleString()}</strong>? This will recognize revenue in your sales analytics.
            </p>

            <div className="mb-4">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Recorded Delivery / COGS Cost (Optional USD)
              </label>
              <input
                type="number"
                placeholder="e.g. 15000"
                value={winRecordedCost}
                onChange={(e) => setWinRecordedCost(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
              />
              <span className="text-[10px] text-slate-400">
                Directly logged to financial profit metrics as verified contract cost.
              </span>
            </div>

            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => {
                  setDealToWin(null);
                  setWinRecordedCost('');
                }}
                className="px-3.5 py-2 rounded-lg border border-slate-300 font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  markDealWon(dealToWin.id, winRecordedCost.trim() ? parseFloat(winRecordedCost) : undefined);
                  setDealToWin(null);
                  setWinRecordedCost('');
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition cursor-pointer"
              >
                Confirm Won Deal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lost Deal Confirmation Modal */}
      {dealToLose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 p-5">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertCircle size={24} />
              <h3 className="font-bold text-slate-900 text-base">Confirm Closed Lost</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Mark <strong>"{dealToLose.name}"</strong> as Closed Lost? Please categorize the primary cause to maintain analytics accuracy:
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Primary Loss Reason *
                </label>
                <select
                  value={lostReasonCategory}
                  onChange={(e) => setLostReasonCategory(e.target.value as LostReasonCategory)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="Budget Constraints">Budget Constraints</option>
                  <option value="Feature Limitations">Feature Limitations</option>
                  <option value="Price Too High">Price Too High</option>
                  <option value="Better Alternative Selected">Better Alternative Selected</option>
                  <option value="Lack of Urgency">Lack of Urgency</option>
                  <option value="Other">Other (Custom specification)</option>
                </select>
              </div>

              {lostReasonCategory === 'Other' && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Custom Specification
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Describe specific loss reason..."
                    value={customLostReason}
                    onChange={(e) => setCustomLostReason(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => {
                  setDealToLose(null);
                  setCustomLostReason('');
                }}
                className="px-3.5 py-2 rounded-lg border border-slate-300 font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const finalReason =
                    lostReasonCategory === 'Other' && customLostReason.trim()
                      ? customLostReason
                      : lostReasonCategory;
                  markDealLost(dealToLose.id, finalReason);
                  setDealToLose(null);
                  setCustomLostReason('');
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold transition cursor-pointer"
              >
                Confirm Lost
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Deal Detail Drawer */}
      {activeDeal && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white shadow-2xl h-full flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{activeDeal.name}</h3>
                <div className="text-xs text-slate-500">
                  {activeDeal.companyName} · Contact: <span className="font-medium text-slate-800">{activeDeal.contactName}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEditDealModal(activeDeal)}
                  className="p-1.5 rounded-md text-slate-500 hover:text-teal-700 hover:bg-slate-100 transition"
                  title="Edit deal value & parameters"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => deleteDeal(activeDeal.id)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                  title="Delete deal"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => setSelectedDealId(null)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
              {/* Value & Stage Bar */}
              <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase">Contract Value</span>
                  <span className="text-2xl font-bold font-mono text-teal-400">
                    ${activeDeal.value.toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block uppercase">Current Stage</span>
                  <span className="capitalize font-semibold text-white text-sm">
                    {activeDeal.stage}
                  </span>
                  <div className="text-[10px] text-teal-300 font-mono mt-0.5">
                    {activeDeal.probability}% Win Probability
                  </div>
                </div>
              </div>

              {/* Move Stage Selector */}
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-2">
                  Advance Deal Stage
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {STAGES.map((s) => (
                    <button
                      key={s.stage}
                      onClick={() => {
                        if (s.stage === 'won') setDealToWin(activeDeal);
                        else if (s.stage === 'lost') setDealToLose(activeDeal);
                        else moveDealStage(activeDeal.id, s.stage);
                      }}
                      className={`px-3 py-1.5 rounded-lg capitalize font-medium transition ${
                        activeDeal.stage === s.stage
                          ? 'bg-teal-600 text-white shadow-xs font-semibold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deal Details */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Expected Close</span>
                  <span className="font-mono text-slate-800">{activeDeal.expectedCloseDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Days in Current Stage</span>
                  <span className="font-mono text-slate-800">{activeDeal.daysInStage} days</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Deal Owner</span>
                  <span className="text-slate-800 font-medium">{activeDeal.owner}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Priority</span>
                  <span className="uppercase font-semibold text-slate-800">{activeDeal.priority}</span>
                </div>
              </div>

              {/* Internal Deal Notes */}
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                  Deal Progression Notes
                </span>
                <p className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-700 leading-relaxed">
                  {activeDeal.notes || 'No internal notes on this deal.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT DEAL MODAL (Supports TEST 5) */}
      {editingDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Edit Opportunity</h3>
                <p className="text-xs text-slate-500">Update value, probability, expected close date, and parameters.</p>
              </div>
              <button
                onClick={() => setEditingDeal(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDealEdit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Deal Title *</label>
                <input
                  type="text"
                  required
                  value={editDealName}
                  onChange={(e) => setEditDealName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Deal Value (USD) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editDealValue}
                    onChange={(e) => setEditDealValue(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Probability (%) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={editDealProb}
                    onChange={(e) => setEditDealProb(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Stage</label>
                  <select
                    value={editDealStage}
                    onChange={(e) => setEditDealStage(e.target.value as DealStage)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white capitalize"
                  >
                    <option value="new">New</option>
                    <option value="qualified">Qualified</option>
                    <option value="discovery">Discovery</option>
                    <option value="proposal">Proposal</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Close Date</label>
                  <input
                    type="date"
                    value={editDealCloseDate}
                    onChange={(e) => setEditDealCloseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={editDealPriority}
                    onChange={(e) => setEditDealPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white capitalize"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Deal Owner</label>
                  <input
                    type="text"
                    value={editDealOwner}
                    onChange={(e) => setEditDealOwner(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Recorded Cost (USD)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 15000"
                    value={editDealCost}
                    onChange={(e) => setEditDealCost(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {editDealStage === 'lost' && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Loss Reason Category *</label>
                  <select
                    value={editDealLostReason}
                    onChange={(e) => setEditDealLostReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="Budget Constraints">Budget Constraints</option>
                    <option value="Feature Limitations">Feature Limitations</option>
                    <option value="Price Too High">Price Too High</option>
                    <option value="Better Alternative Selected">Better Alternative Selected</option>
                    <option value="Lack of Urgency">Lack of Urgency</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  value={editDealNotes}
                  onChange={(e) => setEditDealNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDeal(null)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-xs"
                >
                  Save Deal Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
