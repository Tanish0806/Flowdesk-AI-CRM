import { Contact, Company, Lead, Deal, Activity, Task } from '../types/crm';

export interface AIResponse {
  answer: string;
  source: 'gemini' | 'local_engine';
  suggestedActions?: { label: string; actionType: string; payload?: Record<string, unknown> }[];
  draftEmail?: {
    recipientEmail: string;
    recipientName: string;
    subject: string;
    body: string;
  };
}

export async function askFlowAI(
  prompt: string,
  contextData: {
    contacts: Contact[];
    companies: Company[];
    leads: Lead[];
    deals: Deal[];
    activities: Activity[];
    tasks: Task[];
  }
): Promise<AIResponse> {
  // First attempt secure backend call if server is running with GEMINI_API_KEY
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        summary: {
          totalDeals: contextData.deals.length,
          totalContacts: contextData.contacts.length,
          totalLeads: contextData.leads.length,
          pipelineValue: contextData.deals.reduce((sum, d) => sum + (d.stage !== 'lost' && d.stage !== 'won' ? d.value : 0), 0),
          recentActivities: contextData.activities.slice(0, 5).map(a => `${a.title}: ${a.description}`),
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.text) {
        return {
          answer: data.text,
          source: 'gemini',
        };
      }
    }
  } catch {
    // Graceful fallback to deterministic local intelligence engine
  }

  // Deterministic local intelligence engine grounded in live CRM records
  const q = prompt.toLowerCase();

  // 1. Specific deal status or summarization
  if (q.includes('deal') && (q.includes('status') || q.includes('summarize') || q.includes('health') || q.includes('fintech') || q.includes('cloudscale') || q.includes('datastream') || q.includes('apex'))) {
    const matchedDeal = contextData.deals.find((d) =>
      q.includes(d.name.toLowerCase()) ||
      q.includes(d.companyName.toLowerCase()) ||
      d.companyName.toLowerCase().split(' ')[0] && q.includes(d.companyName.toLowerCase().split(' ')[0])
    ) || contextData.deals.find((d) => d.stage === 'negotiation') || contextData.deals[0];

    if (matchedDeal) {
      const dealActivities = contextData.activities.filter(a => a.relatedTo.id === matchedDeal.id || a.relatedTo.name.includes(matchedDeal.name));
      const relatedContact = contextData.contacts.find(c => c.id === matchedDeal.contactId);

      return {
        answer: `### Opportunity Briefing: ${matchedDeal.name}\n\n` +
          `· **Target Account:** ${matchedDeal.companyName} · **Primary Contact:** ${matchedDeal.contactName} (${relatedContact?.role || 'Lead'})\n` +
          `· **Contract Value:** **$${matchedDeal.value.toLocaleString()}** (USD) · **Win Probability:** ${matchedDeal.probability}%\n` +
          `· **Current Stage:** **${matchedDeal.stage.toUpperCase()}** (${matchedDeal.daysInStage} days in current stage)\n` +
          `· **Expected Close:** ${matchedDeal.expectedCloseDate} · **Account Owner:** ${matchedDeal.owner}\n` +
          `· **Internal Notes:** ${matchedDeal.notes || 'No notes recorded.'}\n\n` +
          `**Recent Timeline:**\n` +
          (dealActivities.length > 0
            ? dealActivities.slice(0, 2).map(a => `· *${a.title}* (${new Date(a.timestamp).toLocaleDateString()}): ${a.description}`).join('\n')
            : '· No recent activity logged for this deal.') +
          `\n\n**Strategic Recommendation:**\n${matchedDeal.daysInStage >= 10 ? 'Deal is stalling in stage. Coordinate an executive check-in to unblock commercial review.' : 'Maintain regular cadence towards target close date.'}`,
        source: 'local_engine',
        suggestedActions: [
          { label: `Open ${matchedDeal.name}`, actionType: 'OPEN_DEAL', payload: { id: matchedDeal.id } },
          { label: 'Draft Follow-up Email', actionType: 'ASK', payload: { q: `Draft follow-up email for ${matchedDeal.name}` } },
        ],
      };
    }
  }

  // 2. Prioritize deals
  if (q.includes('prioritize') || q.includes('deals to focus') || q.includes('this week') || q.includes('urgent')) {
    const openDeals = contextData.deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost');
    const sorted = [...openDeals].sort((a, b) => {
      const scoreA = a.value * (a.probability / 100) + a.daysInStage * 1000;
      const scoreB = b.value * (b.probability / 100) + b.daysInStage * 1000;
      return scoreB - scoreA;
    });

    const top3 = sorted.slice(0, 3);
    const summary = top3
      .map(
        (d, i) =>
          `${i + 1}. **${d.name}**\n   · Value: **$${d.value.toLocaleString()}** (${d.probability}% prob)\n   · Stage: **${d.stage.toUpperCase()}** (${d.daysInStage}d in stage)\n   · Account: ${d.companyName} · Owner: ${d.owner}\n   · Status: ${
            d.daysInStage >= 10 ? '⚠️ High priority: stalled in stage.' : 'Active pipeline progress.'
          }`
      )
      .join('\n\n');

    return {
      answer: `Here is the prioritized deal ranking based on weighted opportunity value and stage velocity:\n\n${summary}\n\n**Strategic Recommendation:**\nFocus first on **${top3[0]?.name || 'key open deals'}** to protect pipeline momentum before month-end.`,
      source: 'local_engine',
      suggestedActions: [
        { label: 'Open Pipeline Kanban', actionType: 'FILTER_DEALS', payload: { stage: 'negotiation' } },
        { label: 'Review Stalled Contracts', actionType: 'SHOW_STALLED' },
      ],
    };
  }

  // 3. Draft follow-up email
  if (q.includes('email') || q.includes('draft') || q.includes('follow-up') || q.includes('followup')) {
    // Match specific deal if named
    const targetDeal = contextData.deals.find((d) =>
      q.includes(d.name.toLowerCase()) ||
      q.includes(d.companyName.toLowerCase()) ||
      (d.companyName.toLowerCase().split(' ')[0] && q.includes(d.companyName.toLowerCase().split(' ')[0]))
    ) || contextData.deals.find((d) => d.stage === 'negotiation' || d.stage === 'proposal') || contextData.deals[0];

    const contact = contextData.contacts.find((c) => c.id === targetDeal?.contactId) || contextData.contacts[0];

    const subject = `Following up: ${targetDeal?.name || 'partnership proposal'}`;
    const body = `Hi ${contact?.name ? contact.name.split(' ')[0] : 'there'},\n\nI hope your week is off to a productive start.\n\nFollowing up on our discussions regarding ${targetDeal?.name || 'the proposed deployment'}. We have aligned our implementation timelines with your requirements, and the technical benchmarks are on track.\n\nDo you have 15 minutes this Thursday or Friday to review final adjustments and agree on next milestones?\n\nBest regards,\nAlex Morgan\nFlowdesk Sales`;

    return {
      answer: `Here is a personalized follow-up email draft grounded in **${contact?.name || 'contact'}** at **${targetDeal?.companyName || 'company'}**.\n\nYou can review, edit, or copy this draft below. As per Flowdesk security policy, no email is ever sent without explicit user review and action.`,
      source: 'local_engine',
      draftEmail: {
        recipientEmail: contact?.email || 'contact@example.com',
        recipientName: contact?.name || 'Client Contact',
        subject,
        body,
      },
      suggestedActions: [
        { label: 'Copy Email to Clipboard', actionType: 'COPY_EMAIL' },
        { label: 'Log as Activity', actionType: 'LOG_EMAIL_ACTIVITY' },
      ],
    };
  }

  // 4. Summarize contact (dynamic matching)
  if (q.includes('summarize') || q.includes('contact') || q.includes('call') || q.includes('brief')) {
    // Find contact mentioned by name in prompt
    const matchedContact = contextData.contacts.find((c) =>
      q.includes(c.name.toLowerCase()) ||
      q.includes(c.name.toLowerCase().split(' ')[0]) ||
      q.includes(c.companyName.toLowerCase())
    ) || contextData.contacts[0];

    const relatedDeals = contextData.deals.filter((d) => d.contactId === matchedContact?.id || d.companyId === matchedContact?.companyId);
    const relatedActs = contextData.activities.filter((a) => a.relatedTo.id === matchedContact?.id || a.relatedTo.name.includes(matchedContact?.name || ''));

    return {
      answer: `### Pre-Call Executive Briefing: ${matchedContact?.name} (${matchedContact?.role})\n\n` +
        `· **Organization:** ${matchedContact?.companyName} (${matchedContact?.country})\n` +
        `· **Lifecycle Stage:** ${matchedContact?.lifecycleStage.toUpperCase()} · Lead Source: ${matchedContact?.leadSource}\n` +
        `· **Account Owner:** ${matchedContact?.owner} · Direct Email: ${matchedContact?.email}\n` +
        `· **Associated Opportunities:** ${relatedDeals.length > 0 ? relatedDeals.map((d) => `${d.name} ($${d.value.toLocaleString()})`).join(', ') : 'None open'}\n` +
        `· **Recent Touchpoints:** ${relatedActs.length > 0 ? `${relatedActs[0].title} on ${new Date(relatedActs[0].timestamp).toLocaleDateString()}` : 'No recent logged activity'}\n\n` +
        `**Key Talking Points:**\n` +
        `1. Acknowledge previous feedback on security architecture and SLAs.\n` +
        `2. Confirm timeline for internal stakeholder sign-off and procurement approval.\n` +
        `3. Provide customized onboarding roadmap for engineering leads.`,
      source: 'local_engine',
      suggestedActions: [
        { label: `View ${matchedContact?.name}'s Profile`, actionType: 'OPEN_CONTACT', payload: { id: matchedContact?.id } },
      ],
    };
  }

  // 5. Recent pipeline changes
  if (q.includes('pipeline change') || q.includes('changes') || q.includes('recent update') || q.includes('timeline')) {
    const stageChanges = contextData.activities.filter(a => a.type === 'stage_change' || a.type === 'deal_update');
    const recentWon = contextData.deals.filter(d => d.stage === 'won');

    const activityList = stageChanges.slice(0, 4).map(a => `· **${a.title}** (${new Date(a.timestamp).toLocaleDateString()}): ${a.description}`).join('\n');

    return {
      answer: `### Recent Sales Pipeline Transitions & Events\n\n` +
        `**Recent Opportunity Transitions:**\n` +
        (activityList || 'No recent stage changes logged.') +
        `\n\n**Won Revenue Milestone:**\n` +
        `· Total closed contracts: ${recentWon.length} deals totaling **$${recentWon.reduce((s, d) => s + d.value, 0).toLocaleString()}**.\n\n` +
        `*Pipeline health audit:* High velocity in Proposal stage; negotiation duration requires AE alignment.`,
      source: 'local_engine',
      suggestedActions: [
        { label: 'View Pipeline Kanban', actionType: 'FILTER_DEALS' },
      ],
    };
  }

  // 6. Cold / Inactive leads
  if (q.includes('cold') || q.includes('inactive') || q.includes('stuck') || q.includes('stalled')) {
    const coldLeads = contextData.leads.filter((l) => l.status === 'contacted' || l.status === 'new' || l.status === 'researching');
    const stalledDeals = contextData.deals.filter((d) => d.daysInStage >= 10 && d.stage !== 'won' && d.stage !== 'lost');

    const leadItems = coldLeads.slice(0, 3).map((l) => `· **${l.name}** (${l.company}) — Score: ${l.score}/100. Status: ${l.status}. Next Action: ${l.nextAction}`).join('\n');
    const dealItems = stalledDeals.map((d) => `· **${d.name}** — $${d.value.toLocaleString()} in **${d.stage}** (${d.daysInStage} days)`).join('\n');

    return {
      answer: `### Inactivity & Pipeline Stagnation Report\n\n` +
        `**Stalled Deals (>10 Days in Same Stage):**\n${dealItems || 'None currently exceeding threshold.'}\n\n` +
        `**Leads Requiring Prompt Re-engagement:**\n${leadItems}\n\n` +
        `*Recommended action:* Trigger a personalized follow-up sequence or reassign secondary check-in.`,
      source: 'local_engine',
      suggestedActions: [
        { label: 'Filter Stalled Pipeline', actionType: 'FILTER_STALLED' },
      ],
    };
  }

  // 7. Data hygiene audit / Incomplete records
  if (q.includes('incomplete') || q.includes('missing') || q.includes('hygiene') || q.includes('audit')) {
    const incompleteContacts = contextData.contacts.filter((c) => !c.phone || !c.nextFollowUpAt);
    return {
      answer: `### CRM Data Hygiene Audit\n\n` +
        `Identified **${incompleteContacts.length} contacts** missing scheduled next follow-up dates or direct telephone contacts:\n\n` +
        incompleteContacts.slice(0, 4).map((c) => `· **${c.name}** (${c.companyName}) — Missing: ${!c.nextFollowUpAt ? 'Next follow-up date' : 'Direct phone'}`).join('\n') +
        `\n\nMaintaining complete follow-up schedules increases conversion velocity by an estimated 28%.`,
      source: 'local_engine',
    };
  }

  // Default general intelligence synthesis
  const totalOpenValue = contextData.deals
    .filter((d) => d.stage !== 'won' && d.stage !== 'lost')
    .reduce((sum, d) => sum + d.value, 0);
  const totalWonValue = contextData.deals
    .filter((d) => d.stage === 'won')
    .reduce((sum, d) => sum + d.value, 0);

  return {
    answer: `### Flowdesk Sales Intelligence Overview\n\n` +
      `· **Active Pipeline:** $${totalOpenValue.toLocaleString()} across ${contextData.deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost').length} open opportunities.\n` +
      `· **Closed Won:** $${totalWonValue.toLocaleString()} recognized revenue to date.\n` +
      `· **Top Active Deal:** ${contextData.deals[0]?.name || 'Key Deal'} ($${contextData.deals[0]?.value.toLocaleString() || '0'}).\n` +
      `· **Pending Tasks:** ${contextData.tasks.filter((t) => t.status === 'pending').length} tasks currently scheduled.\n\n` +
      `Ask me to **summarize a deal**, **draft a personalized follow-up email**, or **identify cold leads**.`,
    source: 'local_engine',
    suggestedActions: [
      { label: 'Which deals should I prioritize?', actionType: 'ASK', payload: { q: 'Which deals should I prioritize this week?' } },
      { label: 'Draft follow-up email', actionType: 'ASK', payload: { q: 'Draft a follow-up email for this opportunity.' } },
      { label: 'Show leads that have gone cold', actionType: 'ASK', payload: { q: 'Show leads that have gone cold.' } },
      { label: 'Summarize recent pipeline changes', actionType: 'ASK', payload: { q: 'Summarize recent pipeline changes.' } },
    ],
  };
}
