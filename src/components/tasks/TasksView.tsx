import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Trash2,
  Calendar,
  User,
  Briefcase,
  Edit2,
  X,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Task, TaskPriority } from '../../types/crm';

export const TasksView: React.FC = () => {
  const { tasks, toggleTaskComplete, deleteTask, updateTask, openQuickCreate } = useCRM();

  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'dueToday' | 'overdue' | 'completed'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Task State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueAt, setEditDueAt] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium');
  const [editOwner, setEditOwner] = useState('Alex Morgan');

  const now = new Date('2026-10-13T12:00:00Z');

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const dueDate = new Date(task.dueAt);
      const isPast = dueDate < now && task.status === 'pending';
      const isToday =
        dueDate.toISOString().slice(0, 10) === now.toISOString().slice(0, 10) &&
        task.status === 'pending';

      if (filterTab === 'pending' && task.status !== 'pending') return false;
      if (filterTab === 'completed' && task.status !== 'completed') return false;
      if (filterTab === 'overdue' && !isPast) return false;
      if (filterTab === 'dueToday' && !isToday) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          task.title.toLowerCase().includes(q) ||
          task.relatedTo.name.toLowerCase().includes(q) ||
          task.owner.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tasks, filterTab, searchQuery]);

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDueAt(task.dueAt.slice(0, 16));
    setEditPriority(task.priority);
    setEditOwner(task.owner);
  };

  const handleSaveTaskEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTitle) return;

    updateTask(editingTask.id, {
      title: editTitle,
      dueAt: new Date(editDueAt).toISOString(),
      priority: editPriority,
      owner: editOwner,
    });

    setEditingTask(null);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Task & Action Items</h2>
            <span className="text-xs text-slate-500 font-mono">
              ({tasks.filter((t) => t.status === 'pending').length} pending, {tasks.filter((t) => t.status === 'completed').length} completed)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Follow-ups, scheduled deliverables, and contract reviews.
          </p>
        </div>

        <button
          onClick={() => openQuickCreate('task')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs shadow-xs transition"
        >
          <Plus size={15} />
          <span>Create Task</span>
        </button>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-1 overflow-x-auto text-xs w-full sm:w-auto">
          {(['pending', 'all', 'dueToday', 'overdue', 'completed'] as const).map((tab) => {
            const labels: Record<string, string> = {
              pending: 'Pending',
              all: 'All Tasks',
              dueToday: 'Due Today',
              overdue: 'Overdue',
              completed: 'Completed',
            };
            return (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition whitespace-nowrap ${
                  filterTab === tab
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-8 pr-3 py-1.5 text-xs text-slate-800 border border-slate-200 rounded-lg focus:outline-hidden focus:border-teal-500"
          />
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No tasks found matching current filter.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const dueDate = new Date(task.dueAt);
            const isOverdue = !isCompleted && dueDate < now;

            return (
              <div
                key={task.id}
                className={`p-4 flex items-start gap-3.5 transition hover:bg-slate-50/70 text-xs ${
                  isCompleted ? 'opacity-60 bg-slate-50/40' : ''
                }`}
              >
                {/* Complete checkbox */}
                <button
                  onClick={() => toggleTaskComplete(task.id)}
                  className={`mt-0.5 transition shrink-0 ${
                    isCompleted ? 'text-teal-600' : 'text-slate-400 hover:text-teal-600'
                  }`}
                  aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                >
                  {isCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`font-semibold text-sm ${
                        isCompleted ? 'line-through text-slate-500' : 'text-slate-900'
                      }`}
                    >
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                          task.priority === 'high'
                            ? 'text-rose-600'
                            : task.priority === 'medium'
                            ? 'text-amber-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {task.priority} Priority
                      </span>
                      <button
                        onClick={() => openEditTask(task)}
                        className="text-slate-400 hover:text-slate-700 p-1"
                        title="Edit task"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-slate-300 hover:text-rose-600 p-1"
                        title="Delete task"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock size={12} className={isOverdue ? 'text-rose-500' : 'text-slate-400'} />
                      <span className={isOverdue ? 'text-rose-600 font-semibold' : ''}>
                        Due: {new Date(task.dueAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-slate-700 font-medium">
                      <Briefcase size={12} className="text-slate-400" />
                      <span>{task.relatedTo.name}</span>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <User size={12} className="text-slate-400" />
                      <span>{task.owner}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* EDIT TASK MODAL */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Edit Task</h3>
              <button
                onClick={() => setEditingTask(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTaskEdit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Due Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={editDueAt}
                    onChange={(e) => setEditDueAt(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white capitalize"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Assignee</label>
                <input
                  type="text"
                  value={editOwner}
                  onChange={(e) => setEditOwner(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-xs"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
