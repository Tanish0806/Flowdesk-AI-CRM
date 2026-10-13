import React, { useState } from 'react';
import {
  Settings,
  RefreshCw,
  Download,
  Database,
  Shield,
  Sparkles,
  Users,
  CheckCircle2,
  HardDrive,
  Info,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';

export const SettingsView: React.FC = () => {
  const {
    companies,
    contacts,
    leads,
    deals,
    tasks,
    activities,
    resetDemoData,
    exportDataJSON,
    addToast,
  } = useCRM();

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Workspace & System Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage demo persistence, local storage, backup exports, and environment configuration.
        </p>
      </div>

      {/* Demo Data Management Section */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Database size={18} className="text-teal-600" />
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Demo Data & Storage Lifecycle</h3>
            <p className="text-xs text-slate-500">Browser-local storage with deterministic seeding</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-100 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Companies</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{companies.length}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Contacts</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{contacts.length}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Deals</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{deals.length}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tasks</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{tasks.length}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div>
            <div className="text-xs font-semibold text-slate-800">Export Complete CRM Snapshot</div>
            <p className="text-[11px] text-slate-500">Download a full JSON archive of all entities, notes, and activity history.</p>
          </div>
          <button
            onClick={exportDataJSON}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs transition shadow-2xs"
          >
            <Download size={14} />
            <span>Export JSON Backup</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div>
            <div className="text-xs font-semibold text-rose-700">Restore Default Demo Dataset</div>
            <p className="text-[11px] text-slate-500">
              Reset all records to the original clean sample dataset (removes locally edited entries).
            </p>
          </div>
          <button
            onClick={() => setConfirmResetOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-semibold text-xs transition"
          >
            <RefreshCw size={14} />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-5 text-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-2">Reset Demo Database?</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              This will restore all contacts, companies, leads, deals, and tasks to their original initial demo state.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmResetOpen(false)}
                className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetDemoData();
                  setConfirmResetOpen(false);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-xs"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Configuration & Transparency */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Sparkles size={18} className="text-teal-600" />
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Flow AI Engine & Safety Configuration</h3>
            <p className="text-xs text-slate-500">Autonomous safeguards and LLM backend connectivity</p>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div>
              <span className="font-semibold text-slate-800">Operational Mode</span>
              <p className="text-[11px] text-slate-500">Local deterministic synthesis + Server-side proxy capable</p>
            </div>
            <span className="font-mono text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Active & Grounded
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div>
              <span className="font-semibold text-slate-800">Outreach Safeguard Policy</span>
              <p className="text-[11px] text-slate-500">Draft emails require manual human review and explicit send confirmation</p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 size={14} /> Enforced
            </span>
          </div>
        </div>
      </div>

      {/* Portfolio concept information */}
      <div className="p-4 rounded-xl bg-slate-900 text-slate-300 text-xs flex items-start gap-3">
        <Info size={18} className="text-teal-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed text-[11px]">
          <strong className="text-white block mb-0.5">Flowdesk Independent Portfolio Concept</strong>
          Flowdesk is a fictional concept brand built to showcase commercial SaaS design, frontend dashboard architecture, and sales CRM workflow systems. All companies, contacts, and revenue numbers are realistic demonstration data.
        </div>
      </div>
    </div>
  );
};
