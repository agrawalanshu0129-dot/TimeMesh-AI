import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Conflict } from '../types';

interface ConflictBannerProps {
  conflicts: Conflict[];
}

export default function ConflictBanner({ conflicts }: ConflictBannerProps) {
  const navigate = useNavigate();
  const activeConflicts = conflicts.filter(c => !c.isResolved);

  if (activeConflicts.length === 0) return null;

  const topConflict = activeConflicts.sort((a, b) =>
    a.severity === 'High' ? -1 : b.severity === 'High' ? 1 : 0
  )[0];

  return (
    <button
      onClick={() => navigate(`/conflict/${topConflict.id}`)}
      className="w-full text-left animate-pulse-slow"
      aria-label={`Conflict alert: ${topConflict.title} — tap to resolve`}
    >
      <div className="bg-[#FFECE7] border border-[#F3B9AD] rounded-xl p-3 flex items-center gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-[#F7C4BA] rounded-full flex items-center justify-center">
          <AlertTriangle size={16} className="text-[#B63E2E]" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-text-primary text-sm font-semibold leading-tight font-body">
            {topConflict.title}
          </p>
          <p className="text-[#B63E2E] text-xs mt-0.5 font-body">
            conflict detected — tap to resolve
          </p>
        </div>
        {activeConflicts.length > 1 && (
          <span className="flex-shrink-0 bg-[#F7C4BA] text-[#B63E2E] text-xs font-bold px-2 py-1 rounded-full font-body">
            +{activeConflicts.length - 1}
          </span>
        )}
      </div>
    </button>
  );
}
