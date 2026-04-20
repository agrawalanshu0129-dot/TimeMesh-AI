import { useState } from 'react';
import { Phone, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { CalendarEvent, Member } from '../types';
import ProfilePhotoUploader from '../components/ProfilePhotoUploader';

interface CaregiverViewProps {
  currentMember: Member;
  members: Member[];
  events: CalendarEvent[];
  onUpdateMemberPhoto: (memberId: string, photoUrl?: string) => void;
}

export default function CaregiverView({ currentMember, members, events, onUpdateMemberPhoto }: CaregiverViewProps) {
  const [pickupConfirmed, setPickupConfirmed] = useState(false);
  const [lateAlertSent, setLateAlertSent] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  // Events involving this caregiver today
  const myEvents = events.filter(e => {
    const isToday = e.date === today;
    const isInvited = e.invitedMemberIds.includes(currentMember.id);
    const isOwner = e.ownerId === currentMember.id;
    return isToday && (isInvited || isOwner);
  });

  const owners = members.filter(m => m.role === 'Owner' || m.role === 'Co-Owner');
  const primaryOwner = owners[0];
  const emergencyPhone = primaryOwner?.emergencyContact || currentMember.emergencyContact || '+1 (415) 555-0100';

  const handlePickupConfirm = () => {
    setPickupConfirmed(true);
    // In a real app, this would send a notification to owners
  };

  const handleLateAlert = () => {
    setLateAlertSent(true);
    // In a real app, this would send an alert to owners
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0D2B2B' }}>
      {/* Header */}
      <div className="px-6 pt-14 pb-6">
        <h1 className="font-heading font-bold text-white mb-1" style={{ fontSize: '28px' }}>
          Hello, {currentMember.name.split(' ')[0]}! 👋
        </h1>
        <p className="font-body text-teal-accent" style={{ fontSize: '18px' }}>
          {format(new Date(), 'EEEE, MMMM d')}
        </p>
        <div className="mt-4 max-w-sm">
          <ProfilePhotoUploader
            photoUrl={currentMember.photoUrl}
            initials={currentMember.initials}
            avatarColor={currentMember.avatarColor}
            onSave={photoUrl => onUpdateMemberPhoto(currentMember.id, photoUrl)}
            title="Edit Profile Photo"
          />
        </div>
      </div>

      {/* Today's events */}
      <div className="px-6 mb-8">
        <h2 className="font-body font-semibold text-slate-400 uppercase tracking-wide mb-4" style={{ fontSize: '14px' }}>
          Today's Schedule
        </h2>

        {myEvents.length === 0 ? (
          <div className="bg-slate-card rounded-3xl p-6 text-center">
            <p className="text-slate-400 font-body" style={{ fontSize: '18px' }}>
              No events scheduled for you today 😊
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {myEvents.map(event => {
              const owner = members.find(m => m.id === event.ownerId);
              return (
                <div
                  key={event.id}
                  className="bg-slate-card rounded-3xl p-5"
                  role="article"
                  aria-label={`${event.title}, ${event.startTime} to ${event.endTime}`}
                >
                  <h3 className="text-white font-heading font-bold mb-2" style={{ fontSize: '22px' }}>
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-3 mb-2">
                    <Clock size={18} className="text-teal-accent flex-shrink-0" aria-hidden="true" />
                    <span className="text-teal-accent font-body" style={{ fontSize: '18px' }}>
                      {event.startTime} — {event.endTime}
                    </span>
                  </div>
                  {event.location && (
                    <p className="text-slate-400 font-body mt-1" style={{ fontSize: '16px' }}>
                      📍 {event.location}
                    </p>
                  )}
                  {owner && owner.id !== currentMember.id && (
                    <div className="flex items-center gap-2 mt-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={owner.photoUrl ? undefined : { backgroundColor: owner.avatarColor }}
                        aria-hidden="true"
                      >
                        {owner.photoUrl ? (
                          <img src={owner.photoUrl} alt={owner.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          owner.initials
                        )}
                      </div>
                      <span className="text-slate-400 font-body" style={{ fontSize: '15px' }}>
                        Organized by {owner.name}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-6 space-y-4 mb-8">
        {/* Pickup confirmation */}
        <button
          onClick={handlePickupConfirm}
          disabled={pickupConfirmed}
          className={`w-full rounded-3xl py-5 flex items-center justify-center gap-3 font-body font-bold transition-colors ${
            pickupConfirmed
              ? 'bg-green-700 text-green-200'
              : 'bg-teal text-white active:bg-teal-accent'
          }`}
          style={{ fontSize: '20px', minHeight: '72px' }}
          aria-label={pickupConfirmed ? 'Pickup confirmed' : 'Confirm pickup'}
        >
          <CheckCircle size={24} aria-hidden="true" />
          {pickupConfirmed ? "Confirmed! ✓" : "I've got pickup today ✓"}
        </button>

        {/* Running late */}
        <button
          onClick={handleLateAlert}
          disabled={lateAlertSent}
          className={`w-full rounded-3xl py-5 flex items-center justify-center gap-3 font-body font-bold transition-colors ${
            lateAlertSent
              ? 'bg-slate-700 text-slate-400'
              : 'bg-amber-600 text-white active:bg-amber-700'
          }`}
          style={{ fontSize: '20px', minHeight: '72px' }}
          aria-label={lateAlertSent ? 'Late alert sent' : 'Alert owners you are running late'}
        >
          <AlertTriangle size={24} aria-hidden="true" />
          {lateAlertSent ? 'Alert Sent ✓' : "I'm running late"}
        </button>

        {/* Emergency contact */}
        <a
          href={`tel:${emergencyPhone.replace(/\D/g, '')}`}
          className="w-full rounded-3xl py-5 bg-red-700 text-white flex items-center justify-center gap-3 font-body font-bold active:bg-red-800"
          style={{ fontSize: '20px', minHeight: '72px' }}
          aria-label={`Call emergency contact ${primaryOwner?.name || 'Owner'}`}
        >
          <Phone size={24} aria-hidden="true" />
          Call {primaryOwner?.name?.split(' ')[0] || 'Owner'} (Emergency)
        </a>
      </div>

      {/* Status messages */}
      {pickupConfirmed && (
        <div className="mx-6 bg-green-900/40 border border-green-600/50 rounded-2xl p-4 mb-4">
          <p className="text-green-300 font-body text-center" style={{ fontSize: '16px' }}>
            ✅ {owners.map(o => o.name.split(' ')[0]).join(' & ')} have been notified!
          </p>
        </div>
      )}
      {lateAlertSent && (
        <div className="mx-6 bg-amber-900/40 border border-amber-600/50 rounded-2xl p-4 mb-4">
          <p className="text-amber-300 font-body text-center" style={{ fontSize: '16px' }}>
            📱 Running late alert sent to the group!
          </p>
        </div>
      )}

      {/* Today's date display at bottom */}
      <div className="px-6 pb-12 text-center">
        <p className="text-slate-600 font-body" style={{ fontSize: '14px' }}>
          Showing only events relevant to you
        </p>
      </div>
    </div>
  );
}
