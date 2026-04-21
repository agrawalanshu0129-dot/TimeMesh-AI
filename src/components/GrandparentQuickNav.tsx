import { useNavigate } from 'react-router-dom';
import { Calendar, PlusCircle, MessageCircle, Settings } from 'lucide-react';
import type { ReactNode } from 'react';

export default function GrandparentQuickNav() {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-card border-t border-border-soft z-20 px-3 py-2">
      <div className="grid grid-cols-4 gap-2 max-w-lg mx-auto">
        <QuickNavButton onClick={() => navigate('/dashboard')} icon={<Calendar size={20} />} label="Home" />
        <QuickNavButton onClick={() => navigate('/add-event')} icon={<PlusCircle size={20} />} label="New Event" />
        <QuickNavButton onClick={() => navigate('/ai-assistant')} icon={<MessageCircle size={20} />} label="Help" />
        <QuickNavButton onClick={() => navigate('/settings/accessibility')} icon={<Settings size={20} />} label="Access" />
      </div>
    </div>
  );
}

function QuickNavButton({ onClick, icon, label }: { onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-[#F5F5F3] min-h-[56px]"
      aria-label={label}
    >
      <span className="text-slate-500" aria-hidden="true">{icon}</span>
      <span className="text-[11px] font-body text-text-primary">{label}</span>
    </button>
  );
}
