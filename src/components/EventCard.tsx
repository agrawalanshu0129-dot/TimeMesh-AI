import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, MapPin, Clock } from 'lucide-react';
import type { CalendarEvent, Member } from '../types';

const CATEGORY_COLORS: Record<string, string> = {
  Work: 'border-blue-500 bg-blue-500/10',
  Kids: 'border-green-500 bg-green-500/10',
  Family: 'border-purple-500 bg-purple-500/10',
  Personal: 'border-pink-500 bg-pink-500/10',
  Social: 'border-orange-500 bg-orange-500/10',
  Fitness: 'border-teal-500 bg-teal-500/10',
};

const CATEGORY_CHIP_COLORS: Record<string, string> = {
  Work: 'bg-blue-500/20 text-blue-300',
  Kids: 'bg-green-500/20 text-green-300',
  Family: 'bg-purple-500/20 text-purple-300',
  Personal: 'bg-pink-500/20 text-pink-300',
  Social: 'bg-orange-500/20 text-orange-300',
  Fitness: 'bg-teal-500/20 text-teal-300',
};

interface EventCardProps {
  event: CalendarEvent;
  members: Member[];
  hasConflict?: boolean;
  onEdit?: (event: CalendarEvent) => void;
}

export default function EventCard({ event, members, hasConflict, onEdit }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);
  const owner = members.find(m => m.id === event.ownerId);
  const colorClass = CATEGORY_COLORS[event.category] || 'border-slate-500 bg-slate-500/10';
  const chipClass = CATEGORY_CHIP_COLORS[event.category] || 'bg-slate-500/20 text-slate-300';

  return (
    <div
      className={`rounded-xl border-l-4 ${colorClass} p-3 mb-2 animate-slide-in`}
      style={{ borderLeftColor: colorClass.split(' ')[0].replace('border-', '').replace('-500', '') }}
    >
      <button
        className="w-full text-left"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label={`${event.title}, ${event.startTime} to ${event.endTime}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-text-primary font-semibold text-sm font-body leading-tight">{event.title}</h3>
              {hasConflict && (
                <span
                  className="flex-shrink-0 bg-red-500/20 text-red-400 text-xs px-1.5 py-0.5 rounded-full font-body flex items-center gap-1"
                  aria-label="Has conflict"
                >
                  <AlertCircle size={10} aria-hidden="true" />
                  Conflict
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-slate-400 text-xs font-body">
                <Clock size={11} aria-hidden="true" />
                {event.startTime} – {event.endTime}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-body ${chipClass}`}>
                {event.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {owner && (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-text-primary font-body"
                style={{ backgroundColor: owner.avatarColor }}
                aria-label={`Owner: ${owner.name}`}
                title={owner.name}
              >
                {owner.initials}
              </div>
            )}
            {expanded ? (
              <ChevronUp size={16} className="text-slate-400" aria-hidden="true" />
            ) : (
              <ChevronDown size={16} className="text-slate-400" aria-hidden="true" />
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-border-soft/50 space-y-2 animate-fade-in">
          {event.location && (
            <div className="flex items-start gap-2">
              <MapPin size={13} className="text-teal-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span className="text-slate-300 text-xs font-body">{event.location}</span>
            </div>
          )}
          {event.notes && (
            <p className="text-slate-400 text-xs font-body leading-relaxed">{event.notes}</p>
          )}
          {event.repeat !== 'None' && (
            <span className="inline-block bg-[#F5F5F3] text-slate-300 text-xs px-2 py-0.5 rounded-full font-body">
              🔄 {event.repeat}
            </span>
          )}
          {event.invitedMemberIds.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {event.invitedMemberIds.map(mid => {
                const m = members.find(m => m.id === mid);
                if (!m) return null;
                return (
                  <span
                    key={mid}
                    className="text-xs bg-[#F5F5F3] text-slate-300 px-2 py-0.5 rounded-full font-body"
                  >
                    {m.name}
                  </span>
                );
              })}
            </div>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(event)}
              className="mt-2 w-full py-2 rounded-lg bg-teal-500/20 text-teal-300 text-xs font-semibold font-body min-h-[44px]"
              aria-label={`Edit ${event.title}`}
            >
              Edit Event
            </button>
          )}
        </div>
      )}
    </div>
  );
}
