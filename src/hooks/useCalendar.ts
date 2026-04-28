import { useState, useCallback } from 'react';
import type { CalendarEvent, Conflict, Severity } from '../types';
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from '../services/storageService';

const STORAGE_KEY_EVENTS = STORAGE_KEYS.EVENTS;
const STORAGE_KEY_CONFLICTS = STORAGE_KEYS.CONFLICTS;

function detectConflicts(events: CalendarEvent[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const checked = new Set<string>();

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i];
      const b = events[j];
      const pairKey = [a.id, b.id].sort().join('-');
      if (checked.has(pairKey)) continue;
      checked.add(pairKey);

      if (a.date !== b.date) continue;

      const aStart = timeToMinutes(a.startTime);
      const aEnd = timeToMinutes(a.endTime);
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);

      if (aStart < bEnd && bStart < aEnd) {
        // Overlap detected
        const severity: Severity =
          (a.category === 'Work' || b.category === 'Work') ? 'High'
          : (a.category === 'Kids' || b.category === 'Kids') ? 'Medium'
          : 'Low';

        const existingConflict = conflicts.find(
          c => c.eventIds.includes(a.id) && c.eventIds.includes(b.id)
        );

        if (!existingConflict) {
          conflicts.push({
            id: `conflict-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title: `${a.title} ↔ ${b.title}`,
            severity,
            eventIds: [a.id, b.id],
            isResolved: false,
            detectedAt: new Date().toISOString(),
          });
        }
      }
    }
  }

  return conflicts;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function useCalendar(initialEvents: CalendarEvent[], initialConflicts: Conflict[]) {
  const [events, setEvents] = useState<CalendarEvent[]>(
    () => loadFromStorage(STORAGE_KEY_EVENTS, initialEvents)
  );
  const [conflicts, setConflicts] = useState<Conflict[]>(
    () => loadFromStorage(STORAGE_KEY_CONFLICTS, initialConflicts)
  );

  const saveEvents = useCallback((evts: CalendarEvent[]) => {
    saveToStorage(STORAGE_KEY_EVENTS, evts);
    setEvents(evts);
  }, []);

  const saveConflicts = useCallback((confs: Conflict[]) => {
    saveToStorage(STORAGE_KEY_CONFLICTS, confs);
    setConflicts(confs);
  }, []);

  const addEvent = useCallback((event: CalendarEvent) => {
    const newEvents = [...events, event];
    const newConflicts = detectConflicts(newEvents);

    // Merge with existing resolved conflicts
    const resolvedIds = conflicts.filter(c => c.isResolved).map(c => c.id);
    const mergedConflicts = [
      ...conflicts.filter(c => c.isResolved),
      ...newConflicts.filter(nc => !resolvedIds.includes(nc.id)),
    ];

    // Update conflictIds on events
    const updatedEvents = newEvents.map(e => ({
      ...e,
      conflictIds: mergedConflicts
        .filter(c => !c.isResolved && c.eventIds.includes(e.id))
        .map(c => c.id),
    }));

    saveEvents(updatedEvents);
    saveConflicts(mergedConflicts);

    return newConflicts.filter(nc => nc.eventIds.includes(event.id));
  }, [events, conflicts, saveEvents, saveConflicts]);

  const updateEvent = useCallback((updatedEvent: CalendarEvent) => {
    const newEvents = events.map(e => e.id === updatedEvent.id ? updatedEvent : e);
    const newConflicts = detectConflicts(newEvents);

    const updatedEvents = newEvents.map(e => ({
      ...e,
      conflictIds: newConflicts
        .filter(c => !c.isResolved && c.eventIds.includes(e.id))
        .map(c => c.id),
    }));

    saveEvents(updatedEvents);
    saveConflicts(newConflicts);
  }, [events, saveEvents, saveConflicts]);

  const deleteEvent = useCallback((eventId: string) => {
    const newEvents = events.filter(e => e.id !== eventId);
    const remainingConflicts = conflicts.filter(
      c => !c.eventIds.includes(eventId)
    );

    const updatedEvents = newEvents.map(e => ({
      ...e,
      conflictIds: remainingConflicts
        .filter(c => !c.isResolved && c.eventIds.includes(e.id))
        .map(c => c.id),
    }));

    saveEvents(updatedEvents);
    saveConflicts(remainingConflicts);
  }, [events, conflicts, saveEvents, saveConflicts]);

  const resolveConflict = useCallback((conflictId: string, resolutionId: string) => {
    const updatedConflicts = conflicts.map(c =>
      c.id === conflictId
        ? { ...c, isResolved: true, selectedResolutionId: resolutionId }
        : c
    );

    const updatedEvents = events.map(e => ({
      ...e,
      conflictIds: e.conflictIds.filter(cid => cid !== conflictId),
    }));

    saveConflicts(updatedConflicts);
    saveEvents(updatedEvents);
  }, [conflicts, events, saveConflicts, saveEvents]);

  const getEventsForDate = useCallback((date: string): CalendarEvent[] => {
    return events.filter(e => e.date === date);
  }, [events]);

  const getActiveConflicts = useCallback((): Conflict[] => {
    return conflicts.filter(c => !c.isResolved);
  }, [conflicts]);

  const getUpcomingConflicts = useCallback((hoursAhead: number = 48): Conflict[] => {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() + hoursAhead);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    return conflicts.filter(c => {
      if (c.isResolved) return false;
      const conflictEvents = events.filter(e => c.eventIds.includes(e.id));
      return conflictEvents.some(e => e.date <= cutoffStr);
    });
  }, [conflicts, events]);

  const resetToMockData = useCallback((mockEvents: CalendarEvent[], mockConflicts: Conflict[]) => {
    saveEvents(mockEvents);
    saveConflicts(mockConflicts);
  }, [saveEvents, saveConflicts]);

  return {
    events,
    conflicts,
    addEvent,
    updateEvent,
    deleteEvent,
    resolveConflict,
    getEventsForDate,
    getActiveConflicts,
    getUpcomingConflicts,
    resetToMockData,
  };
}
