import type { Member } from '../types';

interface EquityBarProps {
  members: Member[];
}

export default function EquityBar({ members }: EquityBarProps) {
  const coordinators = members.filter(m => m.role === 'Owner' || m.role === 'Co-Owner');
  if (coordinators.length < 2) return null;

  const total = coordinators.reduce((sum, m) => sum + m.contributionScore, 0) || 1;
  let usedPercentage = 0;
  const coordinatorLoad = coordinators.map((m, index) => {
    const pct = index === coordinators.length - 1
      ? 100 - usedPercentage
      : Math.round((m.contributionScore / total) * 100);
    usedPercentage += pct;
    return { member: m, pct };
  });

  const sortedByLoad = [...coordinatorLoad].sort((a, b) => b.pct - a.pct);
  const primary = sortedByLoad[0];
  const secondary = sortedByLoad[1];
  if (!primary || !secondary) return null;
  const gap = Math.abs(primary.pct - secondary.pct);
  const barBackgroundColor = '#F5F5F3';

  const isUnequal = gap > 20;

  return (
    <div className="bg-slate-card rounded-xl p-4 pb-6" aria-label="Coordination equity bar">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-text-primary text-sm font-semibold font-body">Coordination Load</h3>
        <span className={`text-xs font-body px-2 py-0.5 rounded-full ${isUnequal ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>
          {isUnequal ? 'Unequal' : 'Balanced'}
        </span>
      </div>

      {/* Percentages */}
      <div className="flex flex-wrap gap-2 mb-3">
        {coordinatorLoad.map(({ member, pct }) => (
          <div key={member.id} className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ backgroundColor: barBackgroundColor }}>
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: member.avatarColor }}
              aria-hidden="true"
            />
            <span className="text-text-primary text-xs font-semibold font-body leading-none">{pct}%</span>
          </div>
        ))}
      </div>

      {/* Bar */}
      <div className="relative h-6 rounded-full overflow-hidden flex" style={{ backgroundColor: barBackgroundColor }} aria-hidden="true">
        {coordinatorLoad.map(({ member, pct }) => (
          <div
            key={member.id}
            className="h-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              backgroundColor: member.avatarColor,
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 pb-1">
        {coordinatorLoad.map(({ member }) => (
          <div key={member.id} className="flex items-center gap-1.5 min-w-0">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: member.avatarColor }}
              aria-hidden="true"
            />
            <span className="text-slate-400 text-xs font-body leading-relaxed truncate">{member.name.split(' ')[0]}</span>
          </div>
        ))}
      </div>

      {/* Nudge */}
      {isUnequal && (
        <div className="mt-3 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5">
          <p className="text-amber-300 text-xs font-body leading-relaxed">
            💡 <strong>{primary.member.name.split(' ')[0]}</strong> is carrying most of the coordination load this week — consider redistributing some tasks.
          </p>
        </div>
      )}
    </div>
  );
}
