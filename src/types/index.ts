export type Role = 'Owner' | 'Co-Owner' | 'Member' | 'Caregiver';

export type Category = 'Work' | 'Kids' | 'Family' | 'Personal' | 'Social' | 'Fitness';

export type RepeatType = 'None' | 'Daily' | 'Weekly' | 'Monthly';

export type Severity = 'High' | 'Medium' | 'Low';

export type Visibility = 'Everyone' | 'Owners only' | 'Specific members';

export type EventType = 'Family Outing' | 'Hike/Outdoors' | 'Dinner' | 'Trip' | 'Sports' | 'Custom';

export interface Member {
  id: string;
  name: string;
  role: Role;
  avatarColor: string; // hex color
  initials: string;
  contributionScore: number; // 0-100 percentage of coordination tasks this week
  timezone?: string;
  homeAddress?: string;
  emergencyContact?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  category: Category;
  ownerId: string;
  date: string; // ISO date string YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location?: string;
  notes?: string;
  repeat: RepeatType;
  invitedMemberIds: string[];
  visibility: Visibility;
  conflictIds: string[];
  isResolved?: boolean;
}

export interface Resolution {
  id: string;
  label: string;
  detail: string;
  effort: 'Low' | 'Med' | 'High';
  impact: string;
  whoActsId: string;
  isRecommended?: boolean;
}

export interface Conflict {
  id: string;
  title: string;
  severity: Severity;
  eventIds: string[];
  aiExplanation?: string;
  resolutions?: Resolution[];
  isResolved: boolean;
  detectedAt: string;
}

export interface TrafficAlert {
  eventId: string;
  delayMinutes: number;
  severity: 'warning' | 'danger';
  routeUrl: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface GroupSettings {
  groupName: string;
  groupType: 'Family' | 'Friend Group' | 'Sports Team' | 'Custom';
  notifications: {
    conflictAlerts: boolean;
    trafficAlerts: boolean;
    reminders: '24h' | '2h' | '30min' | 'none';
  };
  language: 'English' | 'Spanish' | 'French' | 'Mandarin';
  accessibility: {
    largeText: boolean;
    highContrast: boolean;
  };
}

export interface AppState {
  currentMemberId: string | null;
  members: Member[];
  events: CalendarEvent[];
  conflicts: Conflict[];
  chatMessages: ChatMessage[];
  settings: GroupSettings;
  selectedDate: string;
}
