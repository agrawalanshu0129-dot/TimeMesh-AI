import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import type { Conflict, CalendarEvent, Member } from '../types';
import { useClaude } from '../hooks/useClaude';

const SEVERITY_COLORS: Record<string, string> = {
  High: 'bg-red-500/20 text-red-400 border-red-500/40',
  Medium: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  Low: 'bg-green-500/20 text-green-400 border-green-500/40',
};

const EFFORT_COLORS: Record<string, string> = {
  Low: 'bg-green-500/20 text-green-300',
  Med: 'bg-amber-500/20 text-amber-300',
  High: 'bg-red-500/20 text-red-300',
};

interface ConflictResolutionProps {
  conflicts: Conflict[];
  events: CalendarEvent[];
  members: Member[];
  onResolve: (conflictId: string, resolutionId: string) => void;
}

export default function ConflictResolution({ conflicts, events, members, onResolve }: ConflictResolutionProps) {
  const navigate = useNavigate();
  const { conflictId } = useParams<{ conflictId: string }>();
  const conflict = conflicts.find(c => c.id === conflictId);

  const [selectedResolution, setSelectedResolution] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [resolved, setResolved] = useState(false);
  const { sendRawMessage, isLoading } = useClaude();

  useEffect(() => {
    if (!conflict) return;

    if (conflict.aiExplanation) {
      typewriterEffect(conflict.aiExplanation);
    } else {
      // Fetch from Claude
      const prompt = `Conflict: "${conflict.title}" (${conflict.severity} severity). 
Affected events: ${conflict.eventIds.map(eid => {
  const e = events.find(ev => ev.id === eid);
  return e ? `"${e.title}" (${e.startTime}–${e.endTime})` : eid;
}).join(', ')}.

Explain this scheduling conflict clearly and suggest 3 specific resolution options. For each: action required, who needs to act, estimated effort (Low/Med/High), impact on family/group.`;

      sendRawMessage(prompt)
        .then(text => {
          setAiExplanation(text);
          typewriterEffect(text);
        })
        .catch(() => {
          const fallback = `This is a ${conflict.severity.toLowerCase()} severity conflict. ${conflict.title} has overlapping time slots that need to be resolved.`;
          typewriterEffect(fallback);
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conflictId]);

  const typewriterEffect = (text: string) => {
    setIsTyping(true);
    setDisplayedText('');
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 20);
    return () => clearInterval(interval);
  };

  const handleApply = () => {
    if (!selectedResolution || !conflict) return;
    onResolve(conflict.id, selectedResolution);
    setResolved(true);
    setTimeout(() => navigate('/dashboard'), 2000);
  };

  if (!conflict) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-400 font-body">Conflict not found</p>
          <button onClick={() => navigate('/dashboard')} className="mt-4 text-teal-accent font-body text-sm">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (resolved) {
    return (
      <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-4">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-green-400" aria-hidden="true" />
          </div>
          <h2 className="text-white font-heading text-2xl font-bold mb-2">Conflict Resolved! 🎉</h2>
          <p className="text-slate-400 font-body text-sm">All members have been notified of the change.</p>
        </div>
      </div>
    );
  }

  const affectedEvents = conflict.eventIds.map(eid => events.find(e => e.id === eid)).filter(Boolean) as CalendarEvent[];
  const resolutions = conflict.resolutions || [];

  return (
    <div className="min-h-screen bg-navy">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-slate-700">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-slate-card flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft size={18} className="text-slate-400" aria-hidden="true" />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-heading font-bold text-base leading-tight">{conflict.title}</h1>
          <span className={`inline-block text-xs font-body px-2 py-0.5 rounded-full border mt-1 ${SEVERITY_COLORS[conflict.severity]}`}>
            {conflict.severity} Severity
          </span>
        </div>
      </div>

      <div className="px-4 py-6 pb-32 space-y-6 max-w-lg mx-auto">
        {/* AI Explanation */}
        <div className="bg-slate-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-teal rounded-full flex items-center justify-center">
              <span className="text-xs text-white" aria-hidden="true">🤖</span>
            </div>
            <span className="text-teal-accent text-xs font-body font-semibold">AI Analysis</span>
            {(isLoading || isTyping) && (
              <span className="text-slate-500 text-xs font-body animate-pulse">typing...</span>
            )}
          </div>
          <p className="text-slate-200 text-sm font-body leading-relaxed whitespace-pre-wrap">
            {displayedText || aiExplanation || 'Analyzing conflict...'}
          </p>
        </div>

        {/* Affected events */}
        <div>
          <h2 className="text-slate-400 text-xs font-body uppercase tracking-wider mb-3">Affected Events</h2>
          <div className="space-y-2">
            {affectedEvents.map(event => {
              const owner = members.find(m => m.id === event.ownerId);
              return (
                <div key={event.id} className="bg-slate-card rounded-xl p-3 flex items-center gap-3">
                  {owner && (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: owner.avatarColor }}
                      aria-label={`Owner: ${owner.name}`}
                    >
                      {owner.initials}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-body text-sm font-semibold">{event.title}</p>
                    <p className="text-slate-400 text-xs font-body">{event.startTime}–{event.endTime}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resolution options */}
        {resolutions.length > 0 && (
          <div>
            <h2 className="text-slate-400 text-xs font-body uppercase tracking-wider mb-3">Resolution Options</h2>
            <div className="space-y-3" role="radiogroup" aria-label="Choose a resolution">
              {resolutions.map(res => {
                const whoActs = members.find(m => m.id === res.whoActsId);
                return (
                  <button
                    key={res.id}
                    onClick={() => setSelectedResolution(res.id)}
                    role="radio"
                    aria-checked={selectedResolution === res.id}
                    className={`w-full text-left rounded-2xl p-4 border transition-colors min-h-[80px] ${
                      selectedResolution === res.id
                        ? 'border-teal bg-teal/10'
                        : 'border-slate-600 bg-slate-card'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-body text-sm font-semibold">{res.label}</span>
                        {res.isRecommended && (
                          <span className="bg-teal/20 text-teal-accent text-xs px-2 py-0.5 rounded-full font-body">
                            ✨ AI Recommended
                          </span>
                        )}
                      </div>
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedResolution === res.id ? 'border-teal bg-teal' : 'border-slate-500'
                      }`}>
                        {selectedResolution === res.id && (
                          <div className="w-2 h-2 rounded-full bg-white" aria-hidden="true" />
                        )}
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs font-body mb-2 leading-relaxed">{res.detail}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-body ${EFFORT_COLORS[res.effort]}`}>
                        Effort: {res.effort}
                      </span>
                      {whoActs && (
                        <span className="text-xs text-slate-400 font-body flex items-center gap-1">
                          <div
                            className="w-4 h-4 rounded-full inline-flex items-center justify-center text-white text-xs"
                            style={{ backgroundColor: whoActs.avatarColor }}
                            aria-hidden="true"
                          >
                            {whoActs.initials[0]}
                          </div>
                          {whoActs.name.split(' ')[0]} acts
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Apply button */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-navy/90 backdrop-blur-sm">
        <button
          onClick={handleApply}
          disabled={!selectedResolution}
          className="w-full bg-teal hover:bg-teal-accent disabled:opacity-40 text-white font-semibold font-body py-4 rounded-2xl min-h-[56px] transition-colors"
        >
          Apply & Notify All Members
        </button>
      </div>
    </div>
  );
}
