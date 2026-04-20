import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Trash2 } from 'lucide-react';
import type { GroupSettings, Member } from '../types';
import RoleGate from '../components/RoleGate';

interface SettingsProps {
  settings: GroupSettings;
  onUpdateSettings: (settings: GroupSettings) => void;
  currentMember: Member | null;
  onLeaveGroup: () => void;
}

export default function Settings({ settings, onUpdateSettings, currentMember, onLeaveGroup }: SettingsProps) {
  const navigate = useNavigate();
  const [s, setS] = useState<GroupSettings>(settings);
  const [saved, setSaved] = useState(false);

  const update = (partial: Partial<GroupSettings>) => {
    setS(prev => ({ ...prev, ...partial }));
  };

  const handleSave = () => {
    onUpdateSettings(s);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleNotif = (key: keyof GroupSettings['notifications'], value: boolean | string) => {
    setS(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  };

  const toggleAccess = (key: keyof GroupSettings['accessibility']) => {
    setS(prev => ({
      ...prev,
      accessibility: { ...prev.accessibility, [key]: !prev.accessibility[key] },
    }));
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-border-soft">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-slate-card flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft size={18} className="text-slate-400" aria-hidden="true" />
        </button>
        <h1 className="text-text-primary font-heading font-bold text-lg">Settings</h1>
      </div>

      <div className="px-4 py-6 pb-32 space-y-6 max-w-lg mx-auto">
        {/* Group Info */}
        <section aria-labelledby="group-settings-heading">
          <h2 id="group-settings-heading" className="text-slate-400 text-xs font-body uppercase tracking-wider mb-3">Group</h2>
          <div className="bg-slate-card rounded-2xl p-4 space-y-4">
            <div>
              <label className="text-slate-300 text-sm font-body block mb-2" htmlFor="group-name-setting">
                Group Name
              </label>
              <input
                id="group-name-setting"
                type="text"
                value={s.groupName}
                onChange={e => update({ groupName: e.target.value })}
                className="w-full bg-[#F5F5F3] text-text-primary font-body rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 min-h-[48px]"
              />
            </div>
            <div>
              <label className="text-slate-300 text-sm font-body block mb-2">Group Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Family', 'Friend Group', 'Sports Team', 'Custom'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => update({ groupType: type })}
                    className={`py-2.5 rounded-xl text-sm font-body border min-h-[44px] transition-colors ${
                      s.groupType === type
                        ? 'bg-teal text-text-primary border-teal'
                        : 'bg-[#F5F5F3] text-slate-400 border-border-soft'
                    }`}
                    aria-pressed={s.groupType === type}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section aria-labelledby="notif-heading">
          <h2 id="notif-heading" className="text-slate-400 text-xs font-body uppercase tracking-wider mb-3">Notifications</h2>
          <div className="bg-slate-card rounded-2xl p-4 space-y-4">
            <ToggleRow
              label="Conflict Alerts"
              description="Get notified when conflicts are detected"
              checked={s.notifications.conflictAlerts}
              onToggle={() => toggleNotif('conflictAlerts', !s.notifications.conflictAlerts)}
            />
            <ToggleRow
              label="Traffic Alerts"
              description="Departure time warnings for location-based events"
              checked={s.notifications.trafficAlerts}
              onToggle={() => toggleNotif('trafficAlerts', !s.notifications.trafficAlerts)}
            />
            <div>
              <label className="text-slate-300 text-sm font-body block mb-2">Event Reminders</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['24h', '2h', '30min', 'none'] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => toggleNotif('reminders', opt)}
                    className={`py-2 rounded-xl text-xs font-body border min-h-[36px] transition-colors ${
                      s.notifications.reminders === opt
                        ? 'bg-teal text-text-primary border-teal'
                        : 'bg-[#F5F5F3] text-slate-400 border-border-soft'
                    }`}
                    aria-pressed={s.notifications.reminders === opt}
                  >
                    {opt === 'none' ? 'Off' : opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Calendar Sync (Mock) */}
        <section aria-labelledby="sync-heading">
          <h2 id="sync-heading" className="text-slate-400 text-xs font-body uppercase tracking-wider mb-3">Calendar Sync</h2>
          <div className="bg-slate-card rounded-2xl p-4 space-y-3">
            <SyncRow icon="🗓️" label="Google Calendar" />
            <SyncRow icon="🍎" label="Apple Calendar" />
          </div>
        </section>

        {/* Language */}
        <section aria-labelledby="language-heading">
          <h2 id="language-heading" className="text-slate-400 text-xs font-body uppercase tracking-wider mb-3">Language</h2>
          <div className="bg-slate-card rounded-2xl p-4">
            <div className="grid grid-cols-2 gap-2">
              {(['English', 'Spanish', 'French', 'Mandarin'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => update({ language: lang })}
                  className={`py-2.5 rounded-xl text-sm font-body border min-h-[44px] transition-colors ${
                    s.language === lang
                      ? 'bg-teal text-text-primary border-teal'
                      : 'bg-[#F5F5F3] text-slate-400 border-border-soft'
                  }`}
                  aria-pressed={s.language === lang}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Accessibility */}
        <section aria-labelledby="access-heading">
          <h2 id="access-heading" className="text-slate-400 text-xs font-body uppercase tracking-wider mb-3">Accessibility</h2>
          <div className="bg-slate-card rounded-2xl p-4 space-y-4">
            <ToggleRow
              label="Large Text"
              description="Increase font size throughout the app"
              checked={s.accessibility.largeText}
              onToggle={() => toggleAccess('largeText')}
            />
            <ToggleRow
              label="High Contrast"
              description="Enhance color contrast for better visibility"
              checked={s.accessibility.highContrast}
              onToggle={() => toggleAccess('highContrast')}
            />
          </div>
        </section>

        {/* Privacy */}
        <section aria-labelledby="privacy-heading">
          <h2 id="privacy-heading" className="text-slate-400 text-xs font-body uppercase tracking-wider mb-3">Data & Privacy</h2>
          <div className="bg-slate-card rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl" aria-hidden="true">🔒</span>
              <div>
                <p className="text-text-primary font-body text-sm font-semibold">Your data stays private</p>
                <p className="text-slate-400 font-body text-xs mt-1 leading-relaxed">
                  We never sell your data. All calendar data is stored locally on your device. AI queries are processed securely and never stored.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section aria-labelledby="danger-heading">
          <h2 id="danger-heading" className="text-slate-400 text-xs font-body uppercase tracking-wider mb-3">Danger Zone</h2>
          <div className="bg-[#FFF3F0] border border-[#F3B9AD] rounded-2xl p-4 space-y-3">
            <button
              onClick={onLeaveGroup}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FFECE7] text-[#B63E2E] text-sm font-body font-semibold min-h-[48px] border border-[#F3B9AD]"
              aria-label="Leave group"
            >
              <LogOut size={16} aria-hidden="true" />
              Leave Group
            </button>
            <RoleGate currentMember={currentMember} allowedRoles={['Owner']}>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
                    onLeaveGroup();
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#F7C4BA] text-[#B63E2E] text-sm font-body font-semibold min-h-[48px]"
                aria-label="Delete group permanently"
              >
                <Trash2 size={16} aria-hidden="true" />
                Delete Group (Owner Only)
              </button>
            </RoleGate>
          </div>
        </section>

        {/* App version */}
        <p className="text-slate-600 text-xs font-body text-center">TimeMesh AI v0.1.0 — Built with ❤️</p>
      </div>

      {/* Save */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-[#FAFAF8]/95 backdrop-blur-sm">
        <button
          onClick={handleSave}
          className="w-full bg-teal hover:bg-teal-accent text-text-primary font-semibold font-body py-4 rounded-2xl min-h-[56px] transition-colors"
        >
          {saved ? '✓ Saved!' : 'Save Settings'}
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

function SyncRow({ icon, label }: { icon: string; label: string }) {
  const [connected, setConnected] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xl" aria-hidden="true">{icon}</span>
        <span className="text-text-primary font-body text-sm">{label}</span>
      </div>
      <button
        onClick={() => setConnected(!connected)}
        className={`text-xs font-body px-3 py-2 rounded-lg min-h-[36px] transition-colors ${
          connected ? 'bg-green-500/20 text-green-400' : 'bg-[#F5F5F3] text-slate-400'
        }`}
        aria-label={`${connected ? 'Disconnect' : 'Connect'} ${label}`}
      >
        {connected ? '✓ Connected' : 'Connect'}
      </button>
    </div>
  );
}
