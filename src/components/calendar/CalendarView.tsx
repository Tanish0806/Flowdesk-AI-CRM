import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  MapPin,
  X,
  FileText,
  Edit2,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { CalendarEvent } from '../../types/crm';

export const CalendarView: React.FC = () => {
  const { calendarEvents, tasks, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent } = useCRM();

  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 0-indexed: 9 = October

  // Create event modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('2026-10-16');
  const [eventTime, setEventTime] = useState('14:00');
  const [eventType, setEventType] = useState<'meeting' | 'call' | 'followup' | 'task'>('meeting');
  const [eventRelated, setEventRelated] = useState('');
  const [eventNotes, setEventNotes] = useState('');

  // Selected event popup
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Edit Event state
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editType, setEditType] = useState<'meeting' | 'call' | 'followup' | 'task'>('meeting');
  const [editRelated, setEditRelated] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrev = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNext = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(9);
  };

  // Generate days in month grid
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  // Combine events and tasks with due dates
  const calendarDays = useMemo(() => {
    const days = [];
    // Pad previous month days
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ dayNumber: null, isCurrentMonth: false, dateStr: '' });
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = calendarEvents.filter((e) => e.start.startsWith(dateStr));
      const dayTasks = tasks.filter((t) => t.dueAt.startsWith(dateStr));
      days.push({
        dayNumber: d,
        isCurrentMonth: true,
        dateStr,
        events: dayEvents,
        tasks: dayTasks,
      });
    }
    return days;
  }, [currentYear, currentMonth, calendarEvents, tasks, daysInMonth, firstDayOfWeek]);

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle) return;

    const startIso = `${eventDate}T${eventTime}:00Z`;
    const endIso = `${eventDate}T${eventTime}:45Z`;

    addCalendarEvent({
      title: eventTitle,
      start: startIso,
      end: endIso,
      type: eventType,
      relatedName: eventRelated || 'Client Meeting',
      attendees: ['Alex Morgan'],
      notes: eventNotes,
    });

    setCreateModalOpen(false);
    setEventTitle('');
    setEventRelated('');
    setEventNotes('');
  };

  const openEditEvent = (ev: CalendarEvent) => {
    setSelectedEvent(null);
    setEditingEvent(ev);
    setEditTitle(ev.title);
    setEditDate(ev.start.slice(0, 10));
    setEditTime(ev.start.slice(11, 16) || '14:00');
    setEditType(ev.type);
    setEditRelated(ev.relatedName);
    setEditNotes(ev.notes || '');
  };

  const handleSaveEditEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !editTitle) return;

    const startIso = `${editDate}T${editTime}:00Z`;
    const endIso = `${editDate}T${editTime}:45Z`;

    updateCalendarEvent(editingEvent.id, {
      title: editTitle,
      start: startIso,
      end: endIso,
      type: editType,
      relatedName: editRelated,
      notes: editNotes,
    });

    setEditingEvent(null);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sales Calendar & Scheduling</h2>
            <span className="text-xs text-slate-500 font-mono">
              (Local Workspace Demo)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordinate executive demos, contract alignment sessions, and team deliverables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Navigation Controls */}
          <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
            <button
              onClick={handlePrev}
              className="p-1 rounded text-slate-600 hover:bg-white hover:text-slate-900 transition"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-white rounded transition"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1 rounded text-slate-600 hover:bg-white hover:text-slate-900 transition"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs shadow-xs transition"
          >
            <Plus size={15} />
            <span>Schedule Event</span>
          </button>
        </div>
      </div>

      {/* Calendar Header Month Title */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
        <h3 className="font-bold text-slate-900 text-base md:text-lg">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-teal-500" /> Meeting / Call
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Task Due
          </span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 text-center text-xs font-semibold text-slate-500 py-2.5 bg-slate-50/70">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 min-h-[500px]">
          {calendarDays.map((cd, index) => {
            const isToday = cd.dateStr === '2026-10-13';

            return (
              <div
                key={index}
                className={`p-2 min-h-[95px] flex flex-col justify-between transition ${
                  !cd.isCurrentMonth ? 'bg-slate-50/30' : 'hover:bg-slate-50/40'
                } ${isToday ? 'bg-teal-50/20' : ''}`}
              >
                {cd.dayNumber && (
                  <>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span
                        className={`font-semibold font-mono h-6 w-6 rounded-full flex items-center justify-center ${
                          isToday ? 'bg-teal-600 text-white shadow-2xs' : 'text-slate-700'
                        }`}
                      >
                        {cd.dayNumber}
                      </span>
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-24 text-[11px]">
                      {cd.events?.map((ev) => (
                        <div
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className="px-2 py-1 rounded bg-teal-50 text-teal-800 border border-teal-200/80 font-medium truncate cursor-pointer hover:bg-teal-100 transition shadow-2xs"
                        >
                          {ev.title}
                        </div>
                      ))}

                      {cd.tasks?.map((t) => (
                        <div
                          key={t.id}
                          className="px-2 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200/80 font-medium truncate"
                        >
                          ✓ {t.title}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule Event Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Schedule Sales Event</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Meeting / Event Title *</label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. CloudScale Executive Alignment"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white capitalize"
                  >
                    <option value="meeting">Meeting</option>
                    <option value="call">Phone Call</option>
                    <option value="followup">Follow-up</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Related Account</label>
                  <input
                    type="text"
                    value={eventRelated}
                    onChange={(e) => setEventRelated(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Agenda / Meeting Notes</label>
                <textarea
                  rows={2}
                  value={eventNotes}
                  onChange={(e) => setEventNotes(e.target.value)}
                  placeholder="Meeting agenda items..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-xs"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Details Popup with Edit Option */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">{selectedEvent.title}</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditEvent(selectedEvent)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded"
                  title="Edit event"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-3 my-4 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Clock size={14} className="text-teal-600" />
                <span className="font-mono">
                  {new Date(selectedEvent.start).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <User size={14} className="text-slate-400" />
                <span>{selectedEvent.relatedName}</span>
              </div>
              {selectedEvent.notes && (
                <p className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-700 leading-relaxed">
                  {selectedEvent.notes}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between">
              <button
                onClick={() => {
                  deleteCalendarEvent(selectedEvent.id);
                  setSelectedEvent(null);
                }}
                className="text-xs text-rose-600 hover:underline"
              >
                Delete Event
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT EVENT MODAL */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Edit Scheduled Event</h3>
              <button
                onClick={() => setEditingEvent(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditEvent} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Title *</label>
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
                  <label className="block font-medium text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white capitalize"
                  >
                    <option value="meeting">Meeting</option>
                    <option value="call">Phone Call</option>
                    <option value="followup">Follow-up</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Related</label>
                  <input
                    type="text"
                    value={editRelated}
                    onChange={(e) => setEditRelated(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
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
                  onClick={() => setEditingEvent(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
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
