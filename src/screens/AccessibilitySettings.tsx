import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, PlusCircle, MessageCircle, Settings } from 'lucide-react';
import type { GroupSettings } from '../types';

interface AccessibilitySettingsProps {
  settings: GroupSettings;
  onUpdateSettings: (settings: GroupSettings) => void;
}

export default function AccessibilitySettings({ settings, onUpdateSettings }: AccessibilitySettingsProps) {
  const navigate = useNavigate();
  const [s, setS] = useState<GroupSettings>(settings);
  const [saved, setSaved] = useState(false);

  const updateAccessibility = (partial: Partial<GroupSettings['accessibility']>) => {
    setS(prev => ({
      ...prev,
      accessibility: {
        ...prev.accessibility,
        ...partial,
      },
    }));
  };

  const toggleGrandparentMode = () => {
    const nextValue = !s.accessibility.grandparentMode;
    updateAccessibility({
      grandparentMode: nextValue,
      largeText: nextValue || s.accessibility.largeText,
      simplifiedNavigation: nextValue,
      plainLanguage: nextValue,
    });
  };

  const handleSave = () => {
    onUpdateSettings(s);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-border-soft">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-slate-card flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft size={18} className="text-slate-400" aria-hidden="true" />
        </button>
        <h1 className="text-text-primary font-heading font-bold text-lg">Accessibility</h1>
      </div>

      <div className="px-4 py-6 pb-32 space-y-6 max-w-lg mx-auto">
        <section className="bg-slate-card rounded-2xl p-4 space-y-4">
          <ToggleRow
            label="Grandparent Mode"
            description="Larger text, simpler words, and easier navigation."
            checked={s.accessibility.grandparentMode}
            onToggle={toggleGrandparentMode}
          />
          <ToggleRow
            label="Large Text"
            description="Makes words easier to read."
            checked={s.accessibility.largeText}
            onToggle={() => updateAccessibility({ largeText: !s.accessibility.largeText })}
          />
          <ToggleRow
            label="High Contrast"
            description="Makes text stand out more from the background."
            checked={s.accessibility.highContrast}
            onToggle={() => updateAccessibility({ highContrast: !s.accessibility.highContrast })}
          />
        </section>

        <section className="bg-slate-card rounded-2xl p-4">
          <h2 className="text-text-primary font-body text-sm font-semibold mb-1">Simple Navigation</h2>
          <p className="text-slate-500 font-body text-xs mb-3">
            These quick buttons keep main actions within 3 taps.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <QuickActionButton icon={<Home size={16} />} label="Home" onClick={() => navigate('/dashboard')} />
            <QuickActionButton icon={<PlusCircle size={16} />} label="New Event" onClick={() => navigate('/add-event')} />
            <QuickActionButton icon={<MessageCircle size={16} />} label="Help Chat" onClick={() => navigate('/ai-assistant')} />
            <QuickActionButton icon={<Settings size={16} />} label="Settings" onClick={() => navigate('/settings')} />
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-[#FAFAF8]/95 backdrop-blur-sm">
        <button
          onClick={handleSave}
          className="w-full bg-teal hover:bg-teal-accent text-text-primary font-semibold font-body py-4 rounded-2xl min-h-[56px] transition-colors"
        >
          {saved ? '✓ Saved!' : 'Save Accessibility'}
        </button>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onToggle }: {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex-1">
        <p className="text-text-primary font-body text-sm font-semibold">{label}</p>
        <p className="text-slate-500 font-body text-xs mt-0.5">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={`Toggle ${label}`}
        onClick={onToggle}
        className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 relative ${checked ? 'bg-teal' : 'bg-slate-600'}`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-7' : 'translate-x-1'}`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

function QuickActionButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-body border min-h-[48px] transition-colors bg-[#F5F5F3] text-text-primary border-border-soft"
    >
      {icon}
      {label}
    </button>
  );
}
