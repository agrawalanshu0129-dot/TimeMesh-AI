import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { Member, ChatMessage, GroupSettings } from './types';
import { useCalendar } from './hooks/useCalendar';
import { mockEvents, mockConflicts, mockMembers, defaultSettings } from './data/mockData';

import Onboarding from './screens/Onboarding';
import Dashboard from './screens/Dashboard';
import AIAssistant from './screens/AIAssistant';
import AddEvent from './screens/AddEvent';
import ConflictResolution from './screens/ConflictResolution';
import GroupPlanner from './screens/GroupPlanner';
import CaregiverView from './screens/CaregiverView';
import MemberManagement from './screens/MemberManagement';
import Settings from './screens/Settings';
import AccessibilitySettings from './screens/AccessibilitySettings';
import GrandparentQuickNav from './components/GrandparentQuickNav';

const STORAGE_KEYS = {
  MEMBER: 'timemesh_current_member',
  MEMBERS: 'timemesh_members',
  CHAT: 'timemesh_chat',
  SETTINGS: 'timemesh_settings',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeSettings(settings: GroupSettings): GroupSettings {
  return {
    ...settings,
    accessibility: {
      largeText: settings.accessibility?.largeText ?? false,
      highContrast: settings.accessibility?.highContrast ?? false,
      grandparentMode: settings.accessibility?.grandparentMode ?? false,
      simplifiedNavigation: settings.accessibility?.simplifiedNavigation ?? false,
      plainLanguage: settings.accessibility?.plainLanguage ?? false,
    },
  };
}

export default function App() {
  const [currentMember, setCurrentMember] = useState<Member | null>(
    loadFromStorage(STORAGE_KEYS.MEMBER, null)
  );
  const [members, setMembers] = useState<Member[]>(
    loadFromStorage(STORAGE_KEYS.MEMBERS, mockMembers)
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(
    loadFromStorage(STORAGE_KEYS.CHAT, [])
  );
  const [settings, setSettings] = useState<GroupSettings>(
    normalizeSettings(loadFromStorage(STORAGE_KEYS.SETTINGS, defaultSettings))
  );

  const {
    events,
    conflicts,
    addEvent,
    updateEvent,
    resolveConflict,
    resetToMockData,
  } = useCalendar(mockEvents, mockConflicts);

  // Initialize mock data if none exists
  useEffect(() => {
    const storedEvents = localStorage.getItem('timemesh_events');
    if (!storedEvents) {
      resetToMockData(mockEvents, mockConflicts);
    }
  }, [resetToMockData]);

  const handleSetCurrentMember = (member: Member | null) => {
    setCurrentMember(member);
    localStorage.setItem(STORAGE_KEYS.MEMBER, JSON.stringify(member));
  };

  const handleSetMembers = (newMembers: Member[]) => {
    setMembers(newMembers);
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(newMembers));
  };

  const handleUpdateMessages = (messages: ChatMessage[]) => {
    setChatMessages(messages);
    localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(messages));
  };

  const handleUpdateSettings = (newSettings: GroupSettings) => {
    const normalized = normalizeSettings(newSettings);
    setSettings(normalized);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(normalized));
  };

  const handleOnboardingComplete = (member: Member, allMembers: Member[], newSettings: GroupSettings) => {
    handleSetCurrentMember(member);
    handleSetMembers(allMembers);
    handleUpdateSettings(newSettings);
  };

  const handleLeaveGroup = () => {
    handleSetCurrentMember(null);
    localStorage.removeItem(STORAGE_KEYS.MEMBER);
  };

  const handleUpdateMemberPhoto = (memberId: string, photoUrl?: string) => {
    const updatedMembers = members.map(member =>
      member.id === memberId ? { ...member, photoUrl } : member
    );
    handleSetMembers(updatedMembers);

    if (currentMember?.id === memberId) {
      handleSetCurrentMember({ ...currentMember, photoUrl });
    }
  };

  const isLoggedIn = !!currentMember;
  const grandparentMode = settings.accessibility.grandparentMode;

  useEffect(() => {
    document.documentElement.classList.toggle('grandparent-mode', grandparentMode);
  }, [grandparentMode]);

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', settings.accessibility.highContrast);
  }, [settings.accessibility.highContrast]);

  return (
    <BrowserRouter>
      <div className={`font-body bg-cream min-h-screen ${grandparentMode ? 'pb-20' : ''}`}>
        <Routes>
          <Route
            path="/"
            element={
              isLoggedIn ? (
                currentMember.role === 'Caregiver' ? (
                  <Navigate to="/caregiver" replace />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              ) : (
                <Navigate to="/onboarding" replace />
              )
            }
          />

          <Route
            path="/onboarding"
            element={
              isLoggedIn ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Onboarding
                  onComplete={handleOnboardingComplete}
                  existingMembers={members}
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                />
              )
            }
          />

          <Route
            path="/dashboard"
            element={
              isLoggedIn ? (
                currentMember.role === 'Caregiver' ? (
                  <Navigate to="/caregiver" replace />
                ) : (
                  <Dashboard
                    currentMember={currentMember}
                    members={members}
                    events={events}
                    conflicts={conflicts}
                    groupName={settings.groupName}
                    plainLanguage={settings.accessibility.plainLanguage}
                    onUpdateMemberPhoto={handleUpdateMemberPhoto}
                  />
                )
              ) : (
                <Navigate to="/onboarding" replace />
              )
            }
          />

          <Route
            path="/ai-assistant"
            element={
              isLoggedIn ? (
                <AIAssistant
                  messages={chatMessages}
                  onUpdateMessages={handleUpdateMessages}
                  events={events}
                  members={members}
                />
              ) : (
                <Navigate to="/onboarding" replace />
              )
            }
          />

          <Route
            path="/add-event"
            element={
              isLoggedIn ? (
                <AddEvent
                  currentMember={currentMember}
                  members={members}
                  events={events}
                  onAddEvent={addEvent}
                  onUpdateEvent={updateEvent}
                />
              ) : (
                <Navigate to="/onboarding" replace />
              )
            }
          />

          <Route
            path="/conflict/:conflictId"
            element={
              isLoggedIn ? (
                <ConflictResolution
                  conflicts={conflicts}
                  events={events}
                  members={members}
                  onResolve={resolveConflict}
                />
              ) : (
                <Navigate to="/onboarding" replace />
              )
            }
          />

          <Route
            path="/group-planner"
            element={
              isLoggedIn ? (
                <GroupPlanner
                  members={members}
                  events={events}
                  onAddEvent={addEvent}
                />
              ) : (
                <Navigate to="/onboarding" replace />
              )
            }
          />

          <Route
            path="/caregiver"
            element={
              isLoggedIn && currentMember ? (
                <CaregiverView
                  currentMember={currentMember}
                  members={members}
                  events={events}
                  onUpdateMemberPhoto={handleUpdateMemberPhoto}
                />
              ) : (
                <Navigate to="/onboarding" replace />
              )
            }
          />

          <Route
            path="/members"
            element={
              isLoggedIn ? (
                <MemberManagement
                  currentMember={currentMember}
                  members={members}
                  events={events}
                  onUpdateMembers={handleSetMembers}
                />
              ) : (
                <Navigate to="/onboarding" replace />
              )
            }
          />

          <Route
            path="/settings"
            element={
              isLoggedIn ? (
                <Settings
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  currentMember={currentMember}
                  onLeaveGroup={handleLeaveGroup}
                  onUpdateMemberPhoto={handleUpdateMemberPhoto}
                />
              ) : (
                <Navigate to="/onboarding" replace />
              )
            }
          />

          <Route
            path="/settings/accessibility"
            element={
              isLoggedIn ? (
                <AccessibilitySettings
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                />
              ) : (
                <Navigate to="/onboarding" replace />
              )
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {isLoggedIn && grandparentMode && <GrandparentQuickNav />}
      </div>
    </BrowserRouter>
  );
}
