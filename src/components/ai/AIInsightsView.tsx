import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Copy,
  Check,
  Mail,
  AlertCircle,
  FileText,
  User,
  Briefcase,
  Flame,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { askFlowAI, AIResponse } from '../../services/flowAIService';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  source?: 'gemini' | 'local_engine';
  suggestedActions?: { label: string; actionType: string; payload?: Record<string, unknown> }[];
  draftEmail?: {
    recipientEmail: string;
    recipientName: string;
    subject: string;
    body: string;
  };
  timestamp: string;
}

export const AIInsightsView: React.FC = () => {
  const {
    contacts,
    companies,
    leads,
    deals,
    activities,
    tasks,
    setCurrentTab,
    setSelectedDealId,
    setSelectedContactId,
    setSelectedLeadId,
    logActivity,
    addToast,
  } = useCRM();

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedDraftId, setCopiedDraftId] = useState<string | null>(null);

  // Email draft edit state (per message)
  const [editedEmailBodies, setEditedEmailBodies] = useState<Record<string, string>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: `### Welcome to Flow AI Sales Intelligence\n\nI analyze your live CRM dataset to help prioritize high-probability deals, surface stalled accounts, and draft tailored follow-up communication.\n\nSelect a recommended prompt below or type any custom query:`,
      source: 'local_engine',
      timestamp: new Date().toISOString(),
      suggestedActions: [
        { label: 'Which deals should I prioritize this week?', actionType: 'ASK', payload: { q: 'Which deals should I prioritize this week?' } },
        { label: 'Summarize Elena Rostova before my call', actionType: 'ASK', payload: { q: 'Summarize this contact before my call.' } },
        { label: 'Draft follow-up email for CloudScale', actionType: 'ASK', payload: { q: 'Draft a follow-up email for this opportunity.' } },
        { label: 'Show leads that have gone cold', actionType: 'ASK', payload: { q: 'Show leads that have gone cold.' } },
        { label: 'Audit incomplete CRM contact records', actionType: 'ASK', payload: { q: 'Identify incomplete contact records.' } },
      ],
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const response = await askFlowAI(textToSend, {
        contacts,
        companies,
        leads,
        deals,
        activities,
        tasks,
      });

      const assistantMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        sender: 'assistant',
        text: response.answer,
        source: response.source,
        suggestedActions: response.suggestedActions,
        draftEmail: response.draftEmail,
        timestamp: new Date().toISOString(),
      };

      if (response.draftEmail) {
        setEditedEmailBodies((prev) => ({
          ...prev,
          [assistantMsg.id]: response.draftEmail!.body,
        }));
      }

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg-' + Date.now(),
          sender: 'assistant',
          text: 'Unable to process query at this time. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: { label: string; actionType: string; payload?: Record<string, unknown> }, msgId?: string) => {
    if (action.actionType === 'ASK' && action.payload?.q) {
      handleSend(action.payload.q as string);
    } else if (action.actionType === 'FILTER_DEALS') {
      setCurrentTab('pipeline');
    } else if (action.actionType === 'SHOW_STALLED' || action.actionType === 'FILTER_STALLED') {
      setCurrentTab('deals');
    } else if (action.actionType === 'OPEN_CONTACT' && action.payload?.id) {
      setCurrentTab('contacts');
      setSelectedContactId(action.payload.id as string);
    } else if (action.actionType === 'OPEN_DEAL' && action.payload?.id) {
      setCurrentTab('deals');
      setSelectedDealId(action.payload.id as string);
    } else if (action.actionType === 'COPY_EMAIL') {
      const draft = messages.find((m) => m.id === msgId)?.draftEmail;
      if (draft) {
        const body = editedEmailBodies[msgId!] || draft.body;
        navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${body}`);
        setCopiedDraftId(msgId!);
        addToast('Email draft copied to clipboard!');
        setTimeout(() => setCopiedDraftId(null), 2500);
      }
    } else if (action.actionType === 'LOG_EMAIL_ACTIVITY') {
      const draft = messages.find((m) => m.id === msgId)?.draftEmail;
      if (draft) {
        const body = editedEmailBodies[msgId!] || draft.body;
        logActivity({
          type: 'email',
          title: `Prepared Follow-up Email: "${draft.subject}"`,
          description: body,
          relatedTo: { type: 'contact', id: 'cont-1', name: draft.recipientName },
          performedBy: 'Alex Morgan',
        });
        addToast(`Email draft logged as activity for ${draft.recipientName}.`);
      }
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-teal-500/20 text-teal-600 flex items-center justify-center">
              <Sparkles size={15} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Flow AI Sales Studio</h2>
            <span className="text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-mono">
              Local CRM Reasoning Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Privacy-first sales copilot: summarize records, prioritize deals, and review draft outreach.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck size={16} className="text-teal-600" />
          <span>Zero external telemetry · Never auto-sends without human approval</span>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col h-[650px] overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 text-xs">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                    isUser
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-slate-900 text-teal-400 shadow-2xs'
                  }`}
                >
                  {isUser ? 'AM' : <Sparkles size={14} />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-4 rounded-xl border leading-relaxed ${
                    isUser
                      ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                      : 'bg-slate-50/80 text-slate-800 border-slate-200/80'
                  }`}
                >
                  {/* Markdown-style content parsing */}
                  <div className="space-y-2 whitespace-pre-line text-xs sm:text-[13px]">
                    {msg.text.split('\n\n').map((paragraph, pIdx) => {
                      if (paragraph.startsWith('### ')) {
                        return (
                          <h4 key={pIdx} className="font-bold text-sm text-slate-900 mt-2 mb-1">
                            {paragraph.replace('### ', '')}
                          </h4>
                        );
                      }
                      return <p key={pIdx}>{paragraph}</p>;
                    })}
                  </div>

                  {/* Draft Email Editor (if present) */}
                  {msg.draftEmail && (
                    <div className="mt-4 p-3.5 bg-white border border-slate-300 rounded-xl space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <Mail size={14} className="text-teal-600" />
                          <span>Generated Follow-up Draft</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          To: {msg.draftEmail.recipientEmail}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Subject</span>
                        <div className="font-medium text-slate-800 text-xs">{msg.draftEmail.subject}</div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase mb-1">
                          Email Body (Editable)
                        </span>
                        <textarea
                          rows={6}
                          value={editedEmailBodies[msg.id] ?? msg.draftEmail.body}
                          onChange={(e) =>
                            setEditedEmailBodies((prev) => ({ ...prev, [msg.id]: e.target.value }))
                          }
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-xs text-slate-800 font-sans focus:outline-hidden focus:border-teal-500"
                        />
                      </div>

                      {/* Approval & Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          * Review carefully before copying or logging.
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleActionClick({ label: 'Copy', actionType: 'COPY_EMAIL' }, msg.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium transition"
                          >
                            {copiedDraftId === msg.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                            <span>{copiedDraftId === msg.id ? 'Copied' : 'Copy Draft'}</span>
                          </button>
                          <button
                            onClick={() => handleActionClick({ label: 'Log Activity', actionType: 'LOG_EMAIL_ACTIVITY' }, msg.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-2xs transition"
                          >
                            <FileText size={13} />
                            <span>Log as Activity</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Suggested Prompt / Navigation Buttons */}
                  {msg.suggestedActions && (
                    <div className="mt-3.5 pt-3 border-t border-slate-200/60 flex flex-wrap gap-1.5">
                      {msg.suggestedActions.map((action, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => handleActionClick(action, msg.id)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                            isUser
                              ? 'bg-teal-800 text-teal-100 hover:bg-teal-900'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-3 max-w-xl">
              <div className="h-8 w-8 rounded-full bg-slate-900 text-teal-400 flex items-center justify-center shrink-0">
                <Sparkles size={14} className="animate-spin" />
              </div>
              <div className="p-3.5 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 text-xs flex items-center gap-2">
                <RefreshCw size={13} className="animate-spin text-teal-600" />
                <span>Flow AI analyzing live CRM records...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3.5 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask Flow AI to summarize records, prioritize deals, or draft emails..."
              className="flex-1 px-4 py-2.5 text-xs text-slate-800 border border-slate-300 rounded-xl focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition"
            >
              <span>Ask</span>
              <Send size={13} />
            </button>
          </form>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span>Flowdesk Copilot v1.0 · Sample CRM Heuristic Grounding</span>
            <span>Explicit user confirmation required for any activity</span>
          </div>
        </div>
      </div>
    </div>
  );
};
