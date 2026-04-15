import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MapPin, ChevronDown } from 'lucide-react';
import type { CalendarEvent, Member, Category, RepeatType, Visibility } from '../types';
import { useClaude } from '../hooks/useClaude';

const CATEGORIES: Category[] = ['Work', 'Kids', 'Family', 'Personal', 'Social', 'Fitness'];

const CATEGORY_COLORS: Record<Category, string> = {
  Work: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
  Kids: 'bg-green-500/20 text-green-300 border-green-500/50',
  Family: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
  Personal: 'bg-pink-500/20 text-pink-300 border-pink-500/50',
  Social: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
  Fitness: 'bg-teal-500/20 text-teal-300 border-teal-500/50',
};

const REPEATS: RepeatType[] = ['None', 'Daily', 'Weekly', 'Monthly'];
const VISIBILITY_OPTIONS: Visibility[] = ['Everyone', 'Owners only', 'Specific members'];

interface AddEventProps {
  currentMember: Member | null;
  members: Member[];
  events: CalendarEvent[];
  onAddEvent: (event: CalendarEvent) => void;
  onUpdateEvent: (event: CalendarEvent) => void;
}

export default function AddEvent({ currentMember, members, events, onAddEvent, onUpdateEvent }: AddEventProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const existingEvent = editId ? events.find(e => e.id === editId) : null;

  const { sendRawMessage, isLoading } = useClaude();

  const today = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState(existingEvent?.title || '');
  const [category, setCategory] = useState<Category>(existingEvent?.category || 'Personal');
  const [ownerId, setOwnerId] = useState(existingEvent?.ownerId || currentMember?.id || members[0]?.id || '');
  const [date, setDate] = useState(existingEvent?.date || today);
  const [startTime, setStartTime] = useState(existingEvent?.startTime || '09:00');
  const [endTime, setEndTime] = useState(existingEvent?.endTime || '10:00');
  const [location, setLocation] = useState(existingEvent?.location || '');
  const [notes, setNotes] = useState(existingEvent?.notes || '');
  const [repeat, setRepeat] = useState<RepeatType>(existingEvent?.repeat || 'None');
  const [visibility, setVisibility] = useState<Visibility>(existingEvent?.visibility || 'Everyone');
  const [invitedMemberIds, setInvitedMemberIds] = useState<string[]>(existingEvent?.invitedMemberIds || []);
  const [conflictWarning, setConflictWarning] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [toast, setToast] = useState('');

  const canEditOwner = currentMember?.role === 'Owner' || currentMember?.role === 'Co-Owner';

  const toggleInvite = (memberId: string) => {
    setInvitedMemberIds(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  const checkLocalConflicts = () => {
    const sameDay = events.filter(e => e.date === date && e.id !== editId);
    const newStart = parseInt(startTime.replace(':', ''));
    const newEnd = parseInt(endTime.replace(':', ''));

    for (const e of sameDay) {
      const eStart = parseInt(e.startTime.replace(':', ''));
      const eEnd = parseInt(e.endTime.replace(':', ''));
      if (newStart < eEnd && eStart < newEnd) {
        return `⚠️ Overlap with "${e.title}" (${e.startTime}–${e.endTime})`;
      }
    }
    return '';
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    const warning = checkLocalConflicts();
    setConflictWarning(warning);

    const event: CalendarEvent = {
      id: existingEvent?.id || `event-${Date.now()}`,
      title: title.trim(),
      category,
      ownerId,
      date,
      startTime,
      endTime,
      location,
      notes,
      repeat,
      invitedMemberIds,
      visibility,
      conflictIds: existingEvent?.conflictIds || [],
    };

    if (existingEvent) {
      onUpdateEvent(event);
    } else {
      onAddEvent(event);
    }

    // Ask Claude about the new event
    try {
      const ownerName = members.find(m => m.id === ownerId)?.name || 'Unknown';
      const prompt = `New event added: "${title}" on ${date} from ${startTime} to ${endTime}${location ? ` at ${location}` : ''}, owned by ${ownerName}, category: ${category}. Any scheduling conflicts or issues to flag?`;
      const response = await sendRawMessage(prompt);
      setAiResponse(response);
      setToast('Event saved! AI checked for issues.');
      setTimeout(() => setToast(''), 5000);
    } catch {
      setToast(existingEvent ? 'Event updated!' : 'Event added!');
      setTimeout(() => setToast(''), 3000);
    }

    if (!warning) {
      navigate(-1);
    }
  };

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
        <h1 className="text-white font-heading font-bold text-lg">
          {existingEvent ? 'Edit Event' : 'New Event'}
        </h1>
      </div>

      <div className="px-4 py-6 pb-32 space-y-5 max-w-lg mx-auto">
        {/* Title */}
        <div>
          <label className="text-slate-300 text-sm font-body block mb-2" htmlFor="event-title">
            Event Title *
          </label>
          <input
            id="event-title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Soccer Practice, Board Meeting"
            className="w-full bg-slate-card text-white placeholder-slate-500 font-body rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 min-h-[48px]"
            aria-required="true"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-slate-300 text-sm font-body block mb-2">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-2 rounded-xl text-xs font-body font-semibold border transition-colors min-h-[36px] ${
                  category === cat ? CATEGORY_COLORS[cat] : 'bg-slate-card text-slate-400 border-slate-600'
                }`}
                aria-pressed={category === cat}
                aria-label={`Category: ${cat}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Owner */}
        <div>
          <label className="text-slate-300 text-sm font-body block mb-2" htmlFor="event-owner">
            Owner
          </label>
          <div className="relative">
            <select
              id="event-owner"
              value={ownerId}
              onChange={e => setOwnerId(e.target.value)}
              disabled={!canEditOwner}
              className="w-full bg-slate-card text-white font-body rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 appearance-none min-h-[48px] disabled:opacity-60"
            >
              {(canEditOwner ? members : members.filter(m => m.id === currentMember?.id)).map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
          </div>
        </div>

        {/* Date & Time */}
        <div>
          <label className="text-slate-300 text-sm font-body block mb-2">Date & Time</label>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-3">
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-card text-white font-body rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 min-h-[48px]"
                aria-label="Event date"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-body block mb-1">Start</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full bg-slate-card text-white font-body rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-teal-500 min-h-[48px]"
                aria-label="Start time"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-body block mb-1">End</label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full bg-slate-card text-white font-body rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-teal-500 min-h-[48px]"
                aria-label="End time"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-body block mb-1">Repeat</label>
              <div className="relative">
                <select
                  value={repeat}
                  onChange={e => setRepeat(e.target.value as RepeatType)}
                  className="w-full bg-slate-card text-white font-body rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-teal-500 appearance-none min-h-[48px] text-xs"
                  aria-label="Repeat frequency"
                >
                  {REPEATS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="text-slate-300 text-sm font-body block mb-2" htmlFor="event-location">
            <MapPin size={13} className="inline mr-1" aria-hidden="true" />
            Location
          </label>
          <input
            id="event-location"
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Add address for traffic alerts"
            className="w-full bg-slate-card text-white placeholder-slate-500 font-body rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 min-h-[48px]"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-slate-300 text-sm font-body block mb-2" htmlFor="event-notes">Notes</label>
          <textarea
            id="event-notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional notes..."
            rows={3}
            className="w-full bg-slate-card text-white placeholder-slate-500 font-body rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 resize-none"
          />
        </div>

        {/* Visibility */}
        <div>
          <label className="text-slate-300 text-sm font-body block mb-2">Visibility</label>
          <div className="flex gap-2 flex-wrap">
            {VISIBILITY_OPTIONS.map(v => (
              <button
                key={v}
                onClick={() => setVisibility(v)}
                className={`px-3 py-2 rounded-xl text-xs font-body border min-h-[36px] transition-colors ${
                  visibility === v
                    ? 'bg-teal text-white border-teal'
                    : 'bg-slate-card text-slate-400 border-slate-600'
                }`}
                aria-pressed={visibility === v}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Invite members */}
        <div>
          <label className="text-slate-300 text-sm font-body block mb-2">Invite Members</label>
          <div className="space-y-2">
            {members.filter(m => m.id !== ownerId).map(m => (
              <button
                key={m.id}
                onClick={() => toggleInvite(m.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors min-h-[52px] ${
                  invitedMemberIds.includes(m.id)
                    ? 'bg-teal/10 border-teal text-white'
                    : 'bg-slate-card border-slate-600 text-slate-400'
                }`}
                aria-pressed={invitedMemberIds.includes(m.id)}
                aria-label={`${invitedMemberIds.includes(m.id) ? 'Remove' : 'Invite'} ${m.name}`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: m.avatarColor }}
                  aria-hidden="true"
                >
                  {m.initials}
                </div>
                <span className="font-body text-sm">{m.name}</span>
                {invitedMemberIds.includes(m.id) && (
                  <span className="ml-auto text-teal text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Conflict warning */}
        {conflictWarning && (
          <div className="bg-red-900/40 border border-red-500/50 rounded-xl p-3">
            <p className="text-red-300 text-sm font-body">{conflictWarning}</p>
          </div>
        )}

        {/* AI response */}
        {aiResponse && (
          <div className="bg-teal/10 border border-teal/30 rounded-xl p-3">
            <p className="text-teal-accent text-xs font-body mb-1">🤖 AI Check</p>
            <p className="text-slate-200 text-sm font-body leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-teal text-white text-sm font-body px-6 py-3 rounded-full shadow-lg z-50 animate-fade-in">
          {toast}
        </div>
      )}

      {/* Save button */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-navy/90 backdrop-blur-sm">
        <button
          onClick={handleSave}
          disabled={!title.trim() || isLoading}
          className="w-full bg-teal hover:bg-teal-accent disabled:opacity-40 text-white font-semibold font-body py-4 rounded-2xl min-h-[56px] transition-colors"
        >
          {isLoading ? 'Checking with AI...' : existingEvent ? 'Save Changes' : 'Add Event'}
        </button>
      </div>
    </div>
  );
}
