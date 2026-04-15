import { Navigation, Bell } from 'lucide-react';
import type { CalendarEvent, Member, TrafficAlert } from '../types';

interface TrafficBannerProps {
  alert: TrafficAlert;
  event: CalendarEvent;
  members: Member[];
  onNotifyGroup?: () => void;
}

export default function TrafficBanner({ alert, event, members, onNotifyGroup }: TrafficBannerProps) {
  const owner = members.find(m => m.id === event.ownerId);
  const isDanger = alert.severity === 'danger';

  const suggestedLeaveMinutes = alert.delayMinutes + 20;
  const hours = Math.floor(suggestedLeaveMinutes / 60);
  const mins = suggestedLeaveMinutes % 60;
  const leaveText = hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;

  return (
    <div
      className={`rounded-xl p-3 border ${
        isDanger
          ? 'bg-red-900/80 border-red-500'
          : 'bg-amber-900/80 border-amber-500'
      }`}
      role="alert"
      aria-label={`Traffic alert for ${event.title}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isDanger ? 'bg-red-500' : 'bg-amber-500'
          }`}
        >
          <span className="text-sm" aria-hidden="true">{isDanger ? '⚠️' : '🚦'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold font-body ${isDanger ? 'text-red-200' : 'text-amber-200'}`}>
            {isDanger
              ? `⚠️ Major delays detected on route to ${event.title}`
              : `🚦 Heads up — traffic on your route to ${event.title}`}
          </p>
          <p className={`text-xs mt-0.5 font-body ${isDanger ? 'text-red-300' : 'text-amber-300'}`}>
            {isDanger
              ? `${alert.delayMinutes} min delay. Consider leaving now or rescheduling.`
              : `Leave ${leaveText} earlier than planned to arrive on time.`}
          </p>
          {owner && (
            <p className="text-xs text-slate-400 mt-0.5 font-body">
              Owner: {owner.name}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <a
          href={alert.routeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold font-body min-h-[44px] ${
            isDanger
              ? 'bg-red-500/30 text-red-200 border border-red-500/50'
              : 'bg-amber-500/30 text-amber-200 border border-amber-500/50'
          }`}
          aria-label="See route on Google Maps"
        >
          <Navigation size={13} aria-hidden="true" />
          See route
        </a>
        {onNotifyGroup && (
          <button
            onClick={onNotifyGroup}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold font-body min-h-[44px] ${
              isDanger
                ? 'bg-red-500 text-white'
                : 'bg-amber-500 text-white'
            }`}
            aria-label="Notify group about traffic delay"
          >
            <Bell size={13} aria-hidden="true" />
            Notify group
          </button>
        )}
      </div>
    </div>
  );
}
