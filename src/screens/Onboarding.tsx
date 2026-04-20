import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, LogIn } from 'lucide-react';
import type { Member, Role, GroupSettings } from '../types';
import ProfilePhotoUploader from '../components/ProfilePhotoUploader';

const ROLES: Role[] = ['Owner', 'Co-Owner', 'Member', 'Caregiver'];

const AVATAR_COLORS = ['#0D9488', '#F59E0B', '#3B82F6', '#A855F7', '#EF4444', '#10B981'];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface OnboardingProps {
  onComplete: (member: Member, members: Member[], settings: GroupSettings) => void;
  existingMembers: Member[];
  settings: GroupSettings;
  onUpdateSettings: (s: GroupSettings) => void;
}

export default function Onboarding({ onComplete, existingMembers, settings, onUpdateSettings }: OnboardingProps) {
  const navigate = useNavigate();
  const [view, setView] = useState<'home' | 'create' | 'join'>('home');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('Member');
  const [groupName, setGroupName] = useState(settings.groupName);
  const [createPhotoUrl, setCreatePhotoUrl] = useState<string | undefined>();
  const [joinPhotoUrl, setJoinPhotoUrl] = useState<string | undefined>();

  const handleCreate = () => {
    if (!name.trim()) return;
    const newMember: Member = {
      id: `member-${Date.now()}`,
      name: name.trim(),
      role: 'Owner',
      avatarColor: AVATAR_COLORS[existingMembers.length % AVATAR_COLORS.length],
      photoUrl: createPhotoUrl,
      initials: getInitials(name.trim()),
      contributionScore: 50,
    };
    const newSettings = { ...settings, groupName: groupName || settings.groupName };
    onUpdateSettings(newSettings);
    onComplete(newMember, [newMember], newSettings);
    navigate('/dashboard');
  };

  const handleJoin = (selectedMember: Member) => {
    onComplete(selectedMember, existingMembers, settings);
    if (selectedMember.role === 'Caregiver') {
      navigate('/caregiver');
    } else {
      navigate('/dashboard');
    }
  };

  const handleNewJoin = () => {
    if (!name.trim()) return;
    const newMember: Member = {
      id: `member-${Date.now()}`,
      name: name.trim(),
      role,
      avatarColor: AVATAR_COLORS[existingMembers.length % AVATAR_COLORS.length],
      photoUrl: joinPhotoUrl,
      initials: getInitials(name.trim()),
      contributionScore: 0,
    };
    onComplete(newMember, [...existingMembers, newMember], settings);
    if (role === 'Caregiver') {
      navigate('/caregiver');
    } else {
      navigate('/dashboard');
    }
  };

  if (view === 'home') {
    return (
      <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-teal/20 border border-teal/30 mb-4">
              <span className="text-4xl" aria-hidden="true">🗓️</span>
            </div>
            <h1 className="text-4xl font-heading font-bold text-white mb-2">TimeMesh AI</h1>
            <p className="text-teal-accent font-body text-base">
              Smart coordination for families & groups
            </p>
          </div>

          {/* Tagline */}
          <div className="bg-slate-card rounded-2xl p-4 mb-8 text-center">
            <p className="text-slate-300 font-body text-sm leading-relaxed italic">
              "We don't just tell you there's a conflict — we prevent it before it happens."
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                setCreatePhotoUrl(undefined);
                setView('create');
              }}
              className="w-full bg-teal hover:bg-teal-accent text-white font-semibold font-body py-4 rounded-2xl flex items-center justify-center gap-3 min-h-[56px] transition-colors"
              aria-label="Create a new group"
            >
              <Plus size={20} aria-hidden="true" />
              Create a Group
            </button>
            <button
              onClick={() => {
                setJoinPhotoUrl(undefined);
                setView('join');
              }}
              className="w-full bg-slate-card hover:bg-slate-700 text-white font-semibold font-body py-4 rounded-2xl flex items-center justify-center gap-3 min-h-[56px] border border-slate-600 transition-colors"
              aria-label="Join an existing group"
            >
              <LogIn size={20} aria-hidden="true" />
              Join a Group
            </button>
          </div>

          {/* Demo hint */}
          <p className="text-slate-500 text-xs text-center mt-6 font-body">
            Demo: Join as an existing member to explore
          </p>
        </div>
      </div>
    );
  }

  if (view === 'create') {
    return (
      <div className="min-h-screen bg-navy px-6 py-12">
        <div className="w-full max-w-sm mx-auto">
          <button
            onClick={() => setView('home')}
            className="text-slate-400 text-sm font-body mb-6 flex items-center gap-2 min-h-[44px]"
            aria-label="Go back"
          >
            ← Back
          </button>

          <h2 className="text-2xl font-heading font-bold text-white mb-2">Create Your Group</h2>
          <p className="text-slate-400 font-body text-sm mb-8">Set up your family or group calendar.</p>

          <div className="space-y-4">
            <div>
              <label className="text-slate-300 text-sm font-body block mb-2" htmlFor="create-name">
                Your Name *
              </label>
              <input
                id="create-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Alex Chen"
                className="w-full bg-slate-card text-white placeholder-slate-500 font-body rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 min-h-[48px]"
                aria-required="true"
              />
            </div>

            <ProfilePhotoUploader
              title="Profile Photo (optional)"
              photoUrl={createPhotoUrl}
              initials={getInitials(name.trim() || 'You')}
              avatarColor={AVATAR_COLORS[existingMembers.length % AVATAR_COLORS.length]}
              onSave={setCreatePhotoUrl}
            />

            <div>
              <label className="text-slate-300 text-sm font-body block mb-2" htmlFor="group-name">
                Group Name
              </label>
              <input
                id="group-name"
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="e.g. The Chen Family"
                className="w-full bg-slate-card text-white placeholder-slate-500 font-body rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 min-h-[48px]"
              />
            </div>

            <div className="bg-slate-card rounded-xl p-3">
              <p className="text-slate-400 text-xs font-body">
                👑 You'll be the <strong className="text-teal-accent">Owner</strong> — full access to all features.
              </p>
            </div>

            <button
              onClick={handleCreate}
              disabled={!name.trim()}
              className="w-full bg-teal hover:bg-teal-accent disabled:opacity-40 text-white font-semibold font-body py-4 rounded-2xl min-h-[56px] transition-colors"
            >
              Create Group
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Join view
  return (
    <div className="min-h-screen bg-navy px-6 py-12">
      <div className="w-full max-w-sm mx-auto">
        <button
          onClick={() => setView('home')}
          className="text-slate-400 text-sm font-body mb-6 flex items-center gap-2 min-h-[44px]"
          aria-label="Go back"
        >
          ← Back
        </button>

        <h2 className="text-2xl font-heading font-bold text-white mb-2">Join a Group</h2>
        <p className="text-slate-400 font-body text-sm mb-6">Select your profile or create a new one.</p>

        {/* Existing members */}
        {existingMembers.length > 0 && (
          <div className="mb-6">
            <h3 className="text-slate-400 text-xs font-body uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users size={13} aria-hidden="true" />
              {settings.groupName}
            </h3>
            <div className="space-y-2">
              {existingMembers.map(member => (
                <button
                  key={member.id}
                  onClick={() => handleJoin(member)}
                  className="w-full bg-slate-card hover:bg-slate-700 rounded-xl p-4 flex items-center gap-3 transition-colors min-h-[64px]"
                  aria-label={`Join as ${member.name}, ${member.role}`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={member.photoUrl ? undefined : { backgroundColor: member.avatarColor }}
                    aria-hidden="true"
                  >
                    {member.photoUrl ? (
                      <img src={member.photoUrl} alt={member.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      member.initials
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-semibold font-body text-sm">{member.name}</p>
                    <p className="text-slate-400 text-xs font-body">{member.role}</p>
                  </div>
                  <span className="text-teal-accent text-xs font-body">Select →</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* New member */}
        <div className="border-t border-slate-700 pt-6">
          <h3 className="text-slate-400 text-xs font-body uppercase tracking-wider mb-3">New Member</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-slate-card text-white placeholder-slate-500 font-body rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 min-h-[48px]"
              aria-label="Your name"
            />
            <div>
              <label className="text-slate-400 text-xs font-body block mb-2">Role</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(r => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`py-2.5 rounded-xl text-sm font-body font-medium transition-colors min-h-[44px] ${
                      role === r
                        ? 'bg-teal text-white'
                        : 'bg-slate-card text-slate-400 border border-slate-600'
                    }`}
                    aria-pressed={role === r}
                    aria-label={`Select role: ${r}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <ProfilePhotoUploader
              title="Profile Photo (optional)"
              photoUrl={joinPhotoUrl}
              initials={getInitials(name.trim() || 'You')}
              avatarColor={AVATAR_COLORS[existingMembers.length % AVATAR_COLORS.length]}
              onSave={setJoinPhotoUrl}
            />
            <button
              onClick={handleNewJoin}
              disabled={!name.trim()}
              className="w-full bg-teal hover:bg-teal-accent disabled:opacity-40 text-white font-semibold font-body py-4 rounded-2xl min-h-[56px] transition-colors"
            >
              Join Group
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
