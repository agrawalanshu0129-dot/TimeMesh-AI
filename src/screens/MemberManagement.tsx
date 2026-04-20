import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Copy } from 'lucide-react';
import type { Member, Role } from '../types';
import RoleGate from '../components/RoleGate';

const ROLE_COLORS: Record<Role, string> = {
  'Owner': 'bg-teal/20 text-teal-accent border-teal/30',
  'Co-Owner': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Member': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Caregiver': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

const ROLES: Role[] = ['Owner', 'Co-Owner', 'Member', 'Caregiver'];

interface MemberManagementProps {
  currentMember: Member | null;
  members: Member[];
  events: import('../types').CalendarEvent[];
  onUpdateMembers: (members: Member[]) => void;
}

export default function MemberManagement({ currentMember, members, events, onUpdateMembers }: MemberManagementProps) {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const isOwner = currentMember?.role === 'Owner' || currentMember?.role === 'Co-Owner';

  const generateInviteCode = () => {
    const code = `TM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    setInviteCode(code);
  };

  const copyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode).catch(() => {});
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const changeRole = (memberId: string, newRole: Role) => {
    if (memberId === currentMember?.id) return; // Cannot demote yourself
    if (currentMember?.role === 'Co-Owner' && newRole === 'Owner') return; // Co-owner can't promote to Owner
    const updated = members.map(m => m.id === memberId ? { ...m, role: newRole } : m);
    onUpdateMembers(updated);
  };

  const removeMember = (memberId: string) => {
    if (memberId === currentMember?.id) return; // Can't remove yourself
    if (window.confirm('Remove this member from the group?')) {
      onUpdateMembers(members.filter(m => m.id !== memberId));
    }
  };

  const getMemberContribution = (memberId: string): number => {
    const memberEvents = events.filter(e => e.ownerId === memberId);
    return memberEvents.length;
  };

  const categories = {
    'Core Family': members.filter(m => m.role === 'Owner' || m.role === 'Co-Owner'),
    'Members': members.filter(m => m.role === 'Member'),
    'Caregivers': members.filter(m => m.role === 'Caregiver'),
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
        <h1 className="text-white font-heading font-bold text-lg">Members</h1>
      </div>

      <div className="px-4 py-6 pb-24 max-w-lg mx-auto space-y-6">
        <RoleGate
          currentMember={currentMember}
          allowedRoles={['Owner', 'Co-Owner']}
          fallback={
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-3">
              <p className="text-amber-300 text-sm font-body">View only — only Owners can manage members.</p>
            </div>
          }
        >
          {/* Invite new member */}
          <div className="bg-slate-card rounded-2xl p-4">
            <h2 className="text-white font-body font-semibold text-sm mb-3 flex items-center gap-2">
              <UserPlus size={16} className="text-teal-accent" aria-hidden="true" />
              Invite New Member
            </h2>
            {!inviteCode ? (
              <button
                onClick={generateInviteCode}
                className="w-full bg-teal/20 border border-teal/30 text-teal-accent text-sm font-body font-semibold py-3 rounded-xl min-h-[48px]"
              >
                Generate Invite Code
              </button>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-700 rounded-xl px-4 py-3 font-mono text-teal-accent text-sm">
                  {inviteCode}
                </div>
                <button
                  onClick={copyCode}
                  className="w-12 h-12 rounded-xl bg-teal flex items-center justify-center"
                  aria-label="Copy invite code"
                >
                  <Copy size={16} className="text-white" aria-hidden="true" />
                </button>
              </div>
            )}
            {copiedCode && (
              <p className="text-green-400 text-xs font-body mt-2">✓ Copied to clipboard!</p>
            )}
          </div>
        </RoleGate>

        {/* Member categories */}
        {Object.entries(categories).map(([category, categoryMembers]) => {
          if (categoryMembers.length === 0) return null;
          return (
            <div key={category}>
              <h2 className="text-slate-400 text-xs font-body uppercase tracking-wider mb-3">
                {category}
              </h2>
              <div className="space-y-2">
                {categoryMembers.map(member => (
                  <div
                    key={member.id}
                    className="bg-slate-card rounded-2xl p-4"
                    aria-label={`${member.name}, ${member.role}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={member.photoUrl ? undefined : { backgroundColor: member.avatarColor }}
                        aria-hidden="true"
                      >
                        {member.photoUrl ? (
                          <img src={member.photoUrl} alt={member.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          member.initials
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white font-body font-semibold text-sm">{member.name}</p>
                          {member.id === currentMember?.id && (
                            <span className="text-slate-500 text-xs font-body">(You)</span>
                          )}
                        </div>
                        <span className={`inline-block text-xs font-body px-2 py-0.5 rounded-full border mt-1 ${ROLE_COLORS[member.role]}`}>
                          {member.role}
                        </span>
                      </div>
                    </div>

                    {/* Contribution */}
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min((getMemberContribution(member.id) / 5) * 100, 100)}%`,
                            backgroundColor: member.avatarColor,
                          }}
                          aria-hidden="true"
                        />
                      </div>
                      <span className="text-slate-500 text-xs font-body">
                        {getMemberContribution(member.id)} events
                      </span>
                    </div>

                    {/* Actions (owners only, can't act on themselves or demote owners if co-owner) */}
                    {isOwner && member.id !== currentMember?.id && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {ROLES.filter(r => r !== member.role).slice(0, 3).map(r => (
                          <button
                            key={r}
                            onClick={() => changeRole(member.id, r)}
                            className="text-xs font-body px-2 py-1.5 rounded-lg bg-slate-700 text-slate-300 min-h-[32px]"
                            aria-label={`Change ${member.name}'s role to ${r}`}
                          >
                            → {r}
                          </button>
                        ))}
                        <button
                          onClick={() => removeMember(member.id)}
                          className="text-xs font-body px-2 py-1.5 rounded-lg bg-red-900/30 text-red-400 min-h-[32px]"
                          aria-label={`Remove ${member.name} from group`}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
