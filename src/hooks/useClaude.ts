import { useState, useCallback } from 'react';
import type { CalendarEvent, Member } from '../types';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are TimeMesh AI — a friendly, proactive scheduling assistant for families and groups.

Your capabilities:
- Detect and clearly explain scheduling conflicts
- Suggest 3 specific resolution options with action steps, who needs to act, estimated effort (Low/Med/High), and impact
- Answer schedule questions concisely
- Suggest optimal times for events based on everyone's availability
- Multi-timezone awareness
- Travel time estimates and delay warnings
- Help plan group outings and find slots that work for everyone
- Natural language event creation and parsing
- Equity nudges for unequal coordination loads

Guidelines:
- Be warm, practical, and concise
- Use names when possible to personalize responses
- Always end responses with 1-2 specific action options the user can take right now
- Keep responses under 300 words unless deep analysis is requested
- Format with clear line breaks for mobile readability
- Use emojis sparingly but effectively for quick scanning`;

interface ClaudeOptions {
  systemPrompt?: string;
  maxTokens?: number;
}

export function useClaude() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (
    userMessage: string,
    calendarContext: { events: CalendarEvent[]; members: Member[] },
    options: ClaudeOptions = {}
  ): Promise<string> => {
    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;

    if (!apiKey || apiKey === 'sk-ant-your-key-here') {
      // Return a helpful mock response when no API key
      return getMockResponse(userMessage, calendarContext);
    }

    setIsLoading(true);
    setError(null);

    const contextBlock = buildCalendarContext(calendarContext.events, calendarContext.members);
    const fullMessage = `${contextBlock}\n\nUser question: ${userMessage}`;

    try {
      const response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: options.maxTokens || 1000,
          system: options.systemPrompt || SYSTEM_PROMPT,
          messages: [{ role: 'user', content: fullMessage }],
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.content
        .map((b: { type: string; text?: string }) => (b.type === 'text' ? b.text : ''))
        .join('');

      return text;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendRawMessage = useCallback(async (
    userMessage: string,
    systemPrompt?: string
  ): Promise<string> => {
    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;

    if (!apiKey || apiKey === 'sk-ant-your-key-here') {
      return getMockConflictAnalysis(userMessage);
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1000,
          system: systemPrompt || SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMessage }],
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      return data.content
        .map((b: { type: string; text?: string }) => (b.type === 'text' ? b.text : ''))
        .join('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { sendMessage, sendRawMessage, isLoading, error };
}

function buildCalendarContext(events: CalendarEvent[], members: Member[]): string {
  const memberList = members.map(m => `- ${m.name} (${m.role})`).join('\n');
  const eventList = events
    .map(e => {
      const owner = members.find(m => m.id === e.ownerId);
      return `- ${e.date} ${e.startTime}–${e.endTime}: "${e.title}" (${e.category}) — Owner: ${owner?.name || 'Unknown'}${e.location ? `, Location: ${e.location}` : ''}${e.conflictIds.length > 0 ? ' ⚠️ CONFLICT' : ''}`;
    })
    .join('\n');

  return `CALENDAR CONTEXT (next 7 days):
Group Members:
${memberList}

Upcoming Events:
${eventList}`;
}

function getMockResponse(userMessage: string, context: { events: CalendarEvent[]; members: Member[] }): string {
  const lower = userMessage.toLowerCase();
  const conflicts = context.events.filter(e => e.conflictIds.length > 0);

  if (lower.includes('conflict')) {
    if (conflicts.length > 0) {
      return `⚠️ I can see ${conflicts.length} conflicting events on your calendar!\n\nThe main issue is **Doctor's Appointment (2:00–3:00pm) overlapping with School Team Practice (2:30–4:00pm)** — Priya is listed as responsible for both.\n\n**Your best options:**\n1. Ask Jay to handle the school practice logistics (they're free at 2pm)\n2. Ask Granny Maya to handle pickup instead\n\n**Action:** Tap the conflict banner on your dashboard to resolve this now.`;
    }
    return "✅ Great news — I don't see any active conflicts in your next 7 days!\n\nWant me to scan further out, or help you find a time for a new event?\n\n**Action:** Ask me 'Find time for family dinner this weekend' to get started.";
  }

  if (lower.includes('free') || lower.includes('available') || lower.includes('saturday')) {
    return "Looking at everyone's schedules for Saturday...\n\n✅ **Priya:** Free all day\n✅ **Jay:** Free after 11am\n✅ **Sia:** Free all day\n⚠️ **Granny Maya:** Has a morning routine until 10am\n✅ **Jenny:** Free all day\n\n**Best window:** Saturday 11am–6pm works for the whole family!\n\n**Action:** Tap 'Add Event' to schedule something, or ask me to create it for you.";
  }

  if (lower.includes('dinner') || lower.includes('outing') || lower.includes('hike')) {
    return "I'd love to help plan that! 🍽️\n\nBased on everyone's availability this week:\n- **Tonight** is busy (Board Meeting conflict)\n- **Tomorrow at 6pm** — Family Dinner is already planned!\n- **Day 4 evening** looks wide open for everyone\n\n**Action:** Would you like me to create a dinner event for Day 4 at 7pm? Just say 'Schedule family dinner Day 4 7pm' and I'll set it up.";
  }

  if (lower.includes('traffic') || lower.includes('leave') || lower.includes('drive')) {
    return "🚦 Checking traffic for your upcoming events...\n\nI see the **Board Meeting** at 123 Market St starts at 3pm. Based on typical SF traffic, you should leave by **2:15pm** to arrive comfortably.\n\n⚠️ Note: This conflicts with Soccer Practice pickup at 3:30pm — consider delegating that task.\n\n**Action:** Tap 'Resolve Conflict' on the dashboard to reassign the pickup.";
  }

  return `Thanks for your message! I'm here to help with scheduling.\n\nHere's a quick summary:\n- 📅 You have **${context.events.length} events** in the next 7 days\n- ⚠️ **${conflicts.length} conflicts** need attention\n- 👥 **${context.members.length} group members** active\n\n**What I can help with:**\n- Resolving conflicts\n- Finding free time slots\n- Planning group events\n- Travel time estimates\n\n**Action:** Ask me something specific like "Any conflicts this week?" or "Find time for a family dinner."`;
}

function getMockConflictAnalysis(prompt: string): string {
  const titleMatch = prompt.match(/Conflict: "([^"]+)"/);
  const severityMatch = prompt.match(/\((\w+) severity\)/);
  const title = titleMatch ? titleMatch[1] : 'This scheduling conflict';
  const severity = severityMatch ? severityMatch[1].toLowerCase() : 'medium';

  return `⚠️ **${title}** is a ${severity}-severity conflict with overlapping time slots that need attention.\n\nHere are 3 resolution options:\n\n**Option 1 — Reschedule one event (Recommended ✨)**\nMove the lower-priority event to an open slot. Low effort, minimal disruption to the group.\n\n**Option 2 — Delegate responsibility**\nAssign another group member to cover one of the conflicting commitments. Medium effort.\n\n**Option 3 — Split attendance**\nHave different members cover each event simultaneously. Requires coordination but keeps both on schedule.\n\n👉 Select an option below and tap "Apply & Notify All Members" to resolve.`;
}
