import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Copy, AlertTriangle } from 'lucide-react';
import type { Member, Role } from '../types';
import RoleGate from '../components/RoleGate';

const ROLE_COLORS: Record<Role, string> = {
  'Owner': 'bg-teal/30 text-text-primary border-teal/40',
  'Co-Owner': 'bg-coral/20 text-text-primary border-coral/40',
  'Member': 'bg-lavender/25 text-text-primary border-lavender/40',
  'Caregiver': 'bg-[#E6F4EA] text-text-primary border-[#BFDCC9]',
};

const ROLES: Role[] = ['Owner', 'Co-Owner', 'Member', 'Caregiver'];

interface MemberManagementProps {
  currentMember: Member | null;
  members: Member[];
  events: import('../types').CalendarEvent[];
  onUpdateMembers: (members: Member[]) => void;
}

interface RevocationRecord {
  id: string;
  removedMember: Member;
  removedAt: string;
  removedBy: string;
  note: string;
}

export default function MemberManagement({ currentMember, members, events, onUpdateMembers }: MemberManagementProps) {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<Member | null>(null);
  const [revocationNote, setRevocationNote] = useState('');
  const [revocationHistory, setRevocationHistory] = useState<RevocationRecord[]>([]);
  const [lastRemoval, setLastRemoval] = useState<{ member: Member; index: number; recordId: string } | null>(null);
  const [feedback, setFeedback] = useState('');

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

  const requestRemoveMember = (member: Member) => {
    if (member.id === currentMember?.id) return;
    setPendingRemoval(member);
    setRevocationNote('');
  };

  const confirmRemoveMember = () => {
    if (!pendingRemoval || pendingRemoval.id === currentMember?.id) return;

    const removedIndex = members.findIndex(m => m.id === pendingRemoval.id);
    if (removedIndex < 0) return;

    const recordId = `revoked-${Date.now()}`;
    const removedAt = new Date().toISOString();

    onUpdateMembers(members.filter(m => m.id !== pendingRemoval.id));
    setRevocationHistory(prev => [
      {
        id: recordId,
        removedMember: pendingRemoval,
        removedAt,
        removedBy: currentMember?.name || 'Owner',
        note: revocationNote.trim() || 'No note added.',
      },
      ...prev,
    ]);
    setLastRemoval({ member: pendingRemoval, index: removedIndex, recordId });
    setFeedback(`Access removed for ${pendingRemoval.name}.`);
    setPendingRemoval(null);
    setRevocationNote('');
  };

  const undoLastRemoval = () => {
    if (!lastRemoval) return;
    const restored = [...members];
    restored.splice(lastRemoval.index, 0, lastRemoval.member);
    onUpdateMembers(restored);
    setRevocationHistory(prev => prev.filter(record => record.id !== lastRemoval.recordId));
    setFeedback(`Restored access for ${lastRemoval.member.name}.`);
    setLastRemoval(null);
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
    <div className="min-h-screen bg-cream text-text-primary">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-border-soft">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-slate-card border border-border-soft flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft size={18} className="text-text-secondary" aria-hidden="true" />
        </button>
        <h1 className="font-heading font-bold text-lg text-text-primary">Members</h1>
      </div>

      <div className="px-4 py-6 pb-24 max-w-lg mx-auto space-y-6">
        {feedback && (
          <div className="bg-[#F3FFF6] border border-[#C8E7D4] rounded-xl p-3">
            <p className="text-sm font-body text-text-primary">{feedback}</p>
            {lastRemoval && (
              <button
                onClick={undoLastRemoval}
                className="mt-2 text-sm font-body font-semibold text-teal-deep underline"
              >
                Undo
              </button>
            )}
          </div>
        )}

        <RoleGate
          currentMember={currentMember}
          allowedRoles={['Owner', 'Co-Owner']}
          fallback={
            <div className="bg-[#FFF8F5] border border-coral/40 rounded-xl p-3">
              <p className="text-text-secondary text-sm font-body">View only — only Owners can manage members.</p>
            </div>
          }
        >
          {/* Invite new member */}
          <div className="bg-slate-card border border-border-soft rounded-2xl p-4">
            <h2 className="font-body font-semibold text-sm mb-3 flex items-center gap-2 text-text-primary">
              <UserPlus size={16} className="text-teal-deep" aria-hidden="true" />
              Invite New Member
            </h2>
            {!inviteCode ? (
              <button
                onClick={generateInviteCode}
                className="w-full bg-[#EEF9F1] border border-[#C8E7D4] text-text-primary text-sm font-body font-semibold py-3 rounded-xl min-h-[48px]"
              >
                Generate Invite Code
              </button>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1 bg-[#F5F5F3] border border-border-soft rounded-xl px-4 py-3 font-mono text-text-primary text-sm">
                  {inviteCode}
                </div>
                <button
                  onClick={copyCode}
                  className="w-12 h-12 rounded-xl bg-teal flex items-center justify-center border border-[#96C8AE]"
                  aria-label="Copy invite code"
                >
                  <Copy size={16} className="text-text-primary" aria-hidden="true" />
                </button>
              </div>
            )}
            {copiedCode && (
              <p className="text-green-700 text-xs font-body mt-2">✓ Copied to clipboard!</p>
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
                    className="bg-slate-card border border-border-soft rounded-2xl p-4"
                    aria-label={`${member.name}, ${member.role}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-text-primary flex-shrink-0"
                        style={{ backgroundColor: member.avatarColor }}
                        aria-hidden="true"
                      >
                        {member.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-text-primary font-body font-semibold text-sm">{member.name}</p>
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
                      <div className="flex-1 h-1.5 bg-[#EEEDE9] rounded-full overflow-hidden">
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

                    {/* Actions */}
                    {isOwner && member.id !== currentMember?.id && (
                      <div className="mt-3 space-y-2">
                        <label htmlFor={`member-role-${member.id}`} className="text-xs font-body text-slate-500 block">
                          Role
                        </label>
                        <select
                          id={`member-role-${member.id}`}
                          value={member.role}
                          onChange={e => changeRole(member.id, e.target.value as Role)}
                          className="w-full bg-[#F5F5F3] border border-border-soft rounded-lg text-sm text-text-primary px-3 py-2"
                          aria-label={`Role for ${member.name}`}
                        >
                          {ROLES.map(roleOption => (
                            <option
                              key={roleOption}
                              value={roleOption}
                              disabled={currentMember?.role === 'Co-Owner' && roleOption === 'Owner'}
                            >
                              {roleOption}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => requestRemoveMember(member)}
                          className="w-full text-sm font-body px-3 py-2 rounded-lg bg-[#FFECE7] text-[#B63E2E] border border-[#F3B9AD] min-h-[40px] font-semibold"
                          aria-label={`Remove ${member.name} from group`}
                        >
                          Remove Access
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {revocationHistory.length > 0 && (
          <section className="bg-[#FBFBF9] border border-border-soft rounded-2xl p-4">
            <h2 className="text-text-primary text-sm font-body font-semibold mb-2">Access Revocation Notes</h2>
            <div className="space-y-2">
              {revocationHistory.map(record => (
                <div key={record.id} className="bg-slate-card border border-border-soft rounded-xl p-3">
                  <p className="text-sm font-body text-text-primary">
                    {record.removedMember.name} access removed by {record.removedBy}
                  </p>
                  {record.removedMember.role === 'Caregiver' && (
                    <p className="text-xs font-body text-[#B63E2E] mt-1">Caregiver access revoked (care responsibility changed)</p>
                  )}
                  <p className="text-xs font-body text-slate-500 mt-1">{record.note}</p>
                  <p className="text-xs font-body text-slate-400 mt-1">
                    {new Date(record.removedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {pendingRemoval && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center px-4 z-20">
          <div className="w-full max-w-sm bg-slate-card border border-[#F3B9AD] rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[#FFECE7] flex items-center justify-center">
                <AlertTriangle size={18} className="text-[#B63E2E]" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-base text-text-primary">Remove access?</h2>
                <p className="text-sm font-body text-text-secondary mt-1">
                  {pendingRemoval.name} will lose access to this group and must be re-invited to return.
                </p>
              </div>
            </div>
            <label htmlFor="revocation-note" className="block text-xs font-body text-slate-500 mt-4 mb-1">
              Revocation note (optional)
            </label>
            <input
              id="revocation-note"
              value={revocationNote}
              onChange={e => setRevocationNote(e.target.value)}
              placeholder="e.g. no longer caregiving"
              className="w-full bg-[#F5F5F3] border border-border-soft rounded-lg text-sm px-3 py-2 text-text-primary"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setPendingRemoval(null)}
                className="flex-1 py-2 rounded-lg border border-border-soft text-sm font-body text-text-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveMember}
                className="flex-1 py-2 rounded-lg bg-[#FFECE7] border border-[#F3B9AD] text-sm font-body font-semibold text-[#B63E2E]"
              >
                Remove Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
