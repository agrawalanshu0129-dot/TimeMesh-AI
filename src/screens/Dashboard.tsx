import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings, Users, Bot, Calendar } from 'lucide-react';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import type { CalendarEvent, Member, Conflict } from '../types';
import ConflictBanner from '../components/ConflictBanner';
import TrafficBanner from '../components/TrafficBanner';
import EventCard from '../components/EventCard';
import EquityBar from '../components/EquityBar';
import { useTrafficAlerts } from '../hooks/useTrafficAlerts';
import ProfilePhotoUploader from '../components/ProfilePhotoUploader';

interface DashboardProps {
  currentMember: Member | null;
  members: Member[];
  events: CalendarEvent[];
  conflicts: Conflict[];
  groupName: string;
  onUpdateMemberPhoto: (memberId: string, photoUrl?: string) => void;
}

export default function Dashboard({
  currentMember,
  members,
  events,
  conflicts,
  groupName,
  onUpdateMemberPhoto,
}: DashboardProps) {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { alerts, getAlertForEvent, formatDepartureTime } = useTrafficAlerts(events);

  const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  const selectedDayEvents = events.filter(e => e.date === selectedDate);
  const activeConflicts = conflicts.filter(c => !c.isResolved);
  const upcomingConflicts = conflicts.filter(c => !c.isResolved);

  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(e => e.date === dateStr);
  };

  const hasDayConflict = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayEvents = events.filter(e => e.date === dateStr);
    return dayEvents.some(e => e.conflictIds.length > 0);
  };

  const trafficAlertsForSelected = alerts.filter(a => {
    const event = events.find(e => e.id === a.eventId);
    return event?.date === selectedDate;
  });

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-heading font-bold text-text-primary">{groupName}</h1>
            <p className="text-slate-400 text-xs font-body mt-0.5">
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/members')}
              className="w-10 h-10 rounded-full bg-slate-card flex items-center justify-center"
              aria-label="View members"
            >
              <Users size={18} className="text-slate-400" aria-hidden="true" />
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="w-10 h-10 rounded-full bg-slate-card flex items-center justify-center"
              aria-label="Settings"
            >
              <Settings size={18} className="text-slate-400" aria-hidden="true" />
            </button>
            {currentMember && (
              <ProfilePhotoUploader
                compact
                photoUrl={currentMember.photoUrl}
                initials={currentMember.initials}
                avatarColor={currentMember.avatarColor}
                onSave={photoUrl => onUpdateMemberPhoto(currentMember.id, photoUrl)}
              />
            )}
          </div>
        </div>

        {/* Member avatars */}
        <div className="flex items-center gap-2 mb-4">
          {members.map(m => (
            <div
              key={m.id}
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-navy"
              style={m.photoUrl ? undefined : { backgroundColor: m.avatarColor }}
              title={m.name}
              aria-label={`${m.name}, ${m.role}`}
            >
              {m.photoUrl ? (
                <img src={m.photoUrl} alt={m.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                m.initials
              )}
            </div>
          ))}
          {currentMember && (
            <span className="text-slate-500 text-xs font-body ml-1">
              {members.length} members
            </span>
          )}
        </div>
      </div>

      {/* 7-day strip */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" role="tablist" aria-label="Select day">
          {days.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const isSelected = dayStr === selectedDate;
            const isToday = isSameDay(day, new Date());
            const dayEvents = getEventsForDay(day);
            const hasConflict = hasDayConflict(day);

            return (
              <button
                key={dayStr}
                onClick={() => setSelectedDate(dayStr)}
                role="tab"
                aria-selected={isSelected}
                aria-label={`${format(day, 'EEEE, MMMM d')}${dayEvents.length > 0 ? `, ${dayEvents.length} events` : ''}${hasConflict ? ', has conflict' : ''}`}
                className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl min-w-[52px] min-h-[64px] transition-colors ${
                  isSelected
                    ? 'bg-teal text-text-primary'
                    : 'bg-slate-card text-slate-400'
                }`}
              >
                <span className="text-xs font-body font-medium">{format(day, 'EEE')}</span>
                <span className={`text-lg font-heading font-bold ${isToday && !isSelected ? 'text-teal-deep' : ''}`}>
                  {format(day, 'd')}
                </span>
                <div className="flex gap-0.5">
                  {dayEvents.length > 0 && (
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${hasConflict ? 'bg-red-400' : isSelected ? 'bg-white' : 'bg-teal-accent'}`}
                      aria-hidden="true"
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Banners */}
      <div className="px-4 space-y-2 mb-4">
        {upcomingConflicts.length > 0 && (
          <ConflictBanner conflicts={activeConflicts} />
        )}
        {trafficAlertsForSelected.map(alert => {
          const event = events.find(e => e.id === alert.eventId);
          if (!event) return null;
          return (
            <TrafficBanner
              key={alert.eventId}
              alert={alert}
              event={event}
              members={members}
              onNotifyGroup={() => window.alert(`Notified all members about traffic delay for "${event.title}"`)}
            />
          );
        })}
      </div>

      {/* Events for selected day */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-text-primary font-heading font-semibold text-base">
            {format(parseISO(selectedDate), 'EEEE, MMM d')}
          </h2>
          <span className="text-slate-400 text-xs font-body">
            {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''}
          </span>
        </div>

        {selectedDayEvents.length === 0 ? (
          <div className="text-center py-10">
            <Calendar size={40} className="text-slate-600 mx-auto mb-3" aria-hidden="true" />
            <p className="text-slate-500 font-body text-sm">No events this day</p>
            <button
              onClick={() => navigate('/add-event')}
              className="mt-4 text-teal-deep text-sm font-body underline"
            >
              Add an event
            </button>
          </div>
        ) : (
          selectedDayEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              members={members}
              hasConflict={event.conflictIds.length > 0}
              onEdit={() => navigate(`/add-event?edit=${event.id}`)}
            />
          ))
        )}
      </div>

      {/* Equity bar */}
      <div className="px-4 mb-24">
        <EquityBar members={members} />
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-card border-t border-border-soft flex justify-around py-3 px-4 z-10">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center"
          aria-label="Dashboard"
        >
          <Calendar size={20} className="text-teal" aria-hidden="true" />
          <span className="text-teal text-xs font-body">Home</span>
        </button>
        <button
          onClick={() => navigate('/group-planner')}
          className="flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center"
          aria-label="Group Planner"
        >
          <Users size={20} className="text-slate-400" aria-hidden="true" />
          <span className="text-slate-400 text-xs font-body">Plan</span>
        </button>
        <button
          onClick={() => navigate('/add-event')}
          className="w-14 h-14 rounded-full bg-teal flex items-center justify-center -mt-4 shadow-lg"
          aria-label="Add new event"
        >
          <Plus size={24} className="text-text-primary" aria-hidden="true" />
        </button>
        <button
          onClick={() => navigate('/ai-assistant')}
          className="flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center"
          aria-label="AI Assistant"
        >
          <Bot size={20} className="text-slate-400" aria-hidden="true" />
          <span className="text-slate-400 text-xs font-body">AI</span>
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center"
          aria-label="Settings"
        >
          <Settings size={20} className="text-slate-400" aria-hidden="true" />
          <span className="text-slate-400 text-xs font-body">Settings</span>
        </button>
      </div>
    </div>
  );
}
