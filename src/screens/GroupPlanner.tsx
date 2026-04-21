import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, CloudRain, CloudSun, Sun, Wind } from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';
import type { CalendarEvent, Member } from '../types';
import { useClaude } from '../hooks/useClaude';

const EVENT_TYPES = ['Family Outing', 'Hike/Outdoors', 'Dinner', 'Trip', 'Sports', 'Custom'] as const;

// Mock weather data
const MOCK_WEATHER = [
  { icon: Sun, label: 'Sunny', temp: '72°F', suitable: true },
  { icon: CloudSun, label: 'Partly Cloudy', temp: '68°F', suitable: true },
  { icon: CloudRain, label: 'Rainy', temp: '58°F', suitable: false },
  { icon: Wind, label: 'Windy', temp: '65°F', suitable: false },
  { icon: Sun, label: 'Clear', temp: '74°F', suitable: true },
  { icon: CloudSun, label: 'Overcast', temp: '61°F', suitable: true },
  { icon: Sun, label: 'Perfect!', temp: '76°F', suitable: true },
];

interface GroupPlannerProps {
  members: Member[];
  events: CalendarEvent[];
  onAddEvent: (event: CalendarEvent) => void;
}

export default function GroupPlanner({ members, events, onAddEvent }: GroupPlannerProps) {
  const navigate = useNavigate();
  const { sendMessage, isLoading } = useClaude();

  const [eventType, setEventType] = useState<typeof EVENT_TYPES[number]>('Family Outing');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>(members.map(m => m.id));
  const [duration, setDuration] = useState(2);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [freeSlots, setFreeSlots] = useState<string[]>([]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  const toggleParticipant = (id: string) => {
    setSelectedParticipantIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const getWeatherForDay = (dayIndex: number) => MOCK_WEATHER[dayIndex % MOCK_WEATHER.length];

  const getBusyBlocks = (memberId: string, date: string) => {
    return events.filter(e => e.date === date && (e.ownerId === memberId || e.invitedMemberIds.includes(memberId)));
  };

  const findFreeSlots = async () => {
    const participantNames = members
      .filter(m => selectedParticipantIds.includes(m.id))
      .map(m => m.name)
      .join(', ');

    const relevantEvents = events.filter(e =>
      selectedParticipantIds.includes(e.ownerId) || e.invitedMemberIds.some(id => selectedParticipantIds.includes(id))
    );

    try {
      const response = await sendMessage(
        `Find a ${duration}-hour slot for a ${eventType} with these participants: ${participantNames}. Consider their existing events and suggest 3 optimal time slots in the next 7 days.`,
        { events: relevantEvents, members: members.filter(m => selectedParticipantIds.includes(m.id)) }
      );
      setAiSuggestion(response);

      // Generate mock free slots based on events
      const slots: string[] = [];
      days.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayEvents = events.filter(e => e.date === dateStr);
        const isBusy = dayEvents.some(e =>
          selectedParticipantIds.includes(e.ownerId)
        );
        if (!isBusy || dayEvents.length < 2) {
          slots.push(dateStr);
        }
      });
      setFreeSlots(slots.slice(0, 3));
    } catch {
      setAiSuggestion("Based on your group's schedule, the best times appear to be Saturday afternoon and Sunday morning when everyone is available.");
      setFreeSlots(days.slice(2, 5).map(d => format(d, 'yyyy-MM-dd')));
    }
  };

  const handleScheduleSlot = (dateStr: string) => {
    const newEvent: CalendarEvent = {
      id: `event-${Date.now()}`,
      title: eventType,
      category: eventType === 'Hike/Outdoors' || eventType === 'Sports' ? 'Fitness' : 'Family',
      ownerId: members[0]?.id || '',
      date: dateStr,
      startTime: '10:00',
      endTime: `${10 + duration}:00`,
      location: '',
      notes: `Planned via Group Planner`,
      repeat: 'None',
      invitedMemberIds: selectedParticipantIds.filter(id => id !== members[0]?.id),
      visibility: 'Everyone',
      conflictIds: [],
    };
    onAddEvent(newEvent);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-border-soft">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-slate-card flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft size={18} className="text-slate-400" aria-hidden="true" />
        </button>
        <h1 className="text-text-primary font-heading font-bold text-lg">Group Planner</h1>
      </div>

      <div className="px-4 py-6 pb-32 space-y-6 max-w-lg mx-auto">
        {/* Event type */}
        <div>
          <label className="text-slate-300 text-sm font-body block mb-3">What are you planning?</label>
          <div className="grid grid-cols-3 gap-2">
            {EVENT_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setEventType(type)}
                className={`py-2.5 px-2 rounded-xl text-xs font-body font-medium border transition-colors min-h-[44px] ${
                  eventType === type
                    ? 'bg-teal text-text-primary border-teal'
                    : 'bg-slate-card text-slate-400 border-border-soft'
                }`}
                aria-pressed={eventType === type}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="text-slate-300 text-sm font-body block mb-2">
            Duration: <span className="text-teal-deep">{duration} hour{duration !== 1 ? 's' : ''}</span>
          </label>
          <input
            type="range"
            min={1}
            max={8}
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            className="w-full accent-teal"
            aria-label="Event duration in hours"
          />
          <div className="flex justify-between text-slate-500 text-xs font-body mt-1">
            <span>1 hr</span>
            <span>8 hrs</span>
          </div>
        </div>

        {/* Participants */}
        <div>
          <label className="text-slate-300 text-sm font-body block mb-3">Participants</label>
          <div className="flex flex-wrap gap-2">
            {members.map(m => (
              <button
                key={m.id}
                onClick={() => toggleParticipant(m.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors min-h-[44px] ${
                  selectedParticipantIds.includes(m.id)
                    ? 'border-teal bg-teal/10 text-text-primary'
                    : 'border-border-soft bg-slate-card text-slate-400'
                }`}
                aria-pressed={selectedParticipantIds.includes(m.id)}
                aria-label={`${selectedParticipantIds.includes(m.id) ? 'Remove' : 'Add'} ${m.name}`}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-text-primary"
                  style={{ backgroundColor: m.avatarColor }}
                  aria-hidden="true"
                >
                  {m.initials}
                </div>
                <span className="text-sm font-body">{m.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Availability grid */}
        <div>
          <h2 className="text-slate-300 text-sm font-body mb-3">Availability Grid</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-body" role="grid" aria-label="Availability grid">
              <thead>
                <tr>
                  <th className="text-slate-500 font-normal pb-2 text-left pr-2" scope="col">Member</th>
                  {days.map(day => (
                    <th key={format(day, 'yyyy-MM-dd')} className="text-slate-500 font-normal pb-2 px-1 text-center" scope="col">
                      {format(day, 'EEE d')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.filter(m => selectedParticipantIds.includes(m.id)).map(member => (
                  <tr key={member.id}>
                    <td className="pr-2 py-1">
                      <div className="flex items-center gap-1">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-text-primary"
                          style={{ backgroundColor: member.avatarColor }}
                          aria-hidden="true"
                        >
                          {member.initials[0]}
                        </div>
                        <span className="text-slate-300">{member.name.split(' ')[0]}</span>
                      </div>
                    </td>
                    {days.map(day => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const busy = getBusyBlocks(member.id, dateStr);
                      return (
                        <td key={dateStr} className="px-1 py-1 text-center">
                          <div
                            className={`w-6 h-6 rounded-md mx-auto ${
                              busy.length > 0 ? 'bg-red-500/40' : 'bg-green-500/40'
                            }`}
                            aria-label={busy.length > 0 ? 'Busy' : 'Free'}
                            title={busy.length > 0 ? `${busy.length} event(s)` : 'Free'}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-green-500/40" aria-hidden="true" />
              <span className="text-slate-500 text-xs font-body">Free</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-red-500/40" aria-hidden="true" />
              <span className="text-slate-500 text-xs font-body">Busy</span>
            </div>
          </div>
        </div>

        {/* Weather (for outdoor events) */}
        {(eventType === 'Hike/Outdoors' || eventType === 'Sports') && (
          <div>
            <h2 className="text-slate-300 text-sm font-body mb-3">
              🌤️ Weather Forecast (next 7 days)
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {days.map((day, i) => {
                const weather = getWeatherForDay(i);
                const WeatherIcon = weather.icon;
                return (
                  <div
                    key={format(day, 'yyyy-MM-dd')}
                    className={`flex-shrink-0 bg-slate-card rounded-xl p-3 text-center min-w-[72px] ${
                      !weather.suitable ? 'opacity-50' : ''
                    }`}
                  >
                    <p className="text-slate-400 text-xs font-body mb-1">{format(day, 'EEE')}</p>
                    <WeatherIcon size={20} className={weather.suitable ? 'text-amber-400 mx-auto' : 'text-slate-500 mx-auto'} aria-hidden="true" />
                    <p className="text-text-primary text-xs font-body mt-1">{weather.temp}</p>
                    <p className={`text-xs font-body ${weather.suitable ? 'text-green-400' : 'text-red-400'}`}>
                      {weather.suitable ? '✓ Good' : '✗ Rain'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Find free slots button */}
        <button
          onClick={findFreeSlots}
          disabled={isLoading || selectedParticipantIds.length === 0}
          className="w-full bg-teal hover:bg-teal-accent disabled:opacity-40 text-text-primary font-semibold font-body py-4 rounded-2xl min-h-[56px] flex items-center justify-center gap-2 transition-colors"
        >
          <Search size={18} aria-hidden="true" />
          {isLoading ? 'Finding slots...' : 'Find Best Times'}
        </button>

        {/* AI Suggestion */}
        {aiSuggestion && (
          <div className="bg-[#EEF9F1] border border-[#C8E7D4] rounded-2xl p-4">
            <p className="text-teal-deep text-xs font-body font-semibold mb-2">🤖 AI Recommendation</p>
            <p className="text-text-secondary text-sm font-body leading-relaxed whitespace-pre-wrap">{aiSuggestion}</p>
          </div>
        )}

        {/* Free slots */}
        {freeSlots.length > 0 && (
          <div>
            <h2 className="text-slate-300 text-sm font-body mb-3">Suggested Times</h2>
            <div className="space-y-2">
              {freeSlots.map(slot => (
                <div key={slot} className="bg-slate-card rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-text-primary font-body text-sm font-semibold">
                      {format(parseISO(slot), 'EEEE, MMMM d')}
                    </p>
                    <p className="text-slate-400 text-xs font-body">
                      10:00 AM — {10 + duration}:00 {10 + duration >= 12 ? 'PM' : 'AM'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleScheduleSlot(slot)}
                    className="bg-teal text-text-primary text-xs font-body font-semibold px-3 py-2 rounded-lg min-h-[36px]"
                    aria-label={`Schedule ${eventType} on ${format(parseISO(slot), 'MMMM d')}`}
                  >
                    Schedule
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
