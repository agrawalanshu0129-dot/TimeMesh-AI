import type { Member } from '../types';

interface EquityBarProps {
  members: Member[];
}

export default function EquityBar({ members }: EquityBarProps) {
  const coordinators = members.filter(m => m.role === 'Owner' || m.role === 'Co-Owner');
  if (coordinators.length < 2) return null;

  const total = coordinators.reduce((sum, m) => sum + m.contributionScore, 0) || 1;
  const primary = coordinators[0];
  const secondary = coordinators[1];

  const primaryPct = Math.round((primary.contributionScore / total) * 100);
  const secondaryPct = 100 - primaryPct;
  const gap = Math.abs(primaryPct - secondaryPct);

  const isUnequal = gap > 20;

  return (
    <div className="bg-slate-card rounded-xl p-4" aria-label="Coordination equity bar">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-text-primary text-sm font-semibold font-body">Coordination Load</h3>
        <span className={`text-xs font-body px-2 py-0.5 rounded-full ${isUnequal ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>
          {isUnequal ? 'Unequal' : 'Balanced'}
        </span>
      </div>

      {/* Bar */}
      <div className="relative h-6 rounded-full overflow-hidden bg-[#F5F5F3] flex" aria-hidden="true">
        <div
          className="h-full transition-all duration-500 flex items-center justify-center"
          style={{
            width: `${primaryPct}%`,
            backgroundColor: primary.avatarColor,
          }}
        >
          {primaryPct > 20 && (
            <span className="text-text-primary text-xs font-bold font-body">{primaryPct}%</span>
          )}
        </div>
        <div
          className="h-full flex-1 flex items-center justify-center"
          style={{ backgroundColor: secondary.avatarColor }}
        >
          {secondaryPct > 20 && (
            <span className="text-text-primary text-xs font-bold font-body">{secondaryPct}%</span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-between mt-2">
        {coordinators.map((m, i) => (
          <div key={m.id} className={`flex items-center gap-1.5 ${i === 1 ? 'flex-row-reverse' : ''}`}>
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: m.avatarColor }}
              aria-hidden="true"
            />
            <span className="text-slate-400 text-xs font-body">{m.name.split(' ')[0]}</span>
          </div>
        ))}
      </div>

      {/* Nudge */}
      {isUnequal && (
        <div className="mt-3 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5">
          <p className="text-amber-300 text-xs font-body leading-relaxed">
            💡 <strong>{primaryPct > secondaryPct ? primary.name.split(' ')[0] : secondary.name.split(' ')[0]}</strong> is carrying most of the coordination load this week — consider redistributing some tasks.
          </p>
        </div>
      )}
    </div>
  );
}
