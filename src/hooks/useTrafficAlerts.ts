import { useState, useEffect, useCallback } from 'react';
import type { CalendarEvent, TrafficAlert } from '../types';
import { format, parseISO, isToday } from 'date-fns';

function getRandomDelay(): number {
  return Math.floor(Math.random() * 36) + 10; // 10-45 minutes
}

function buildGoogleMapsUrl(location: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location)}`;
}

function timeToDate(dateStr: string, timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number);
  const d = parseISO(dateStr);
  d.setHours(h, m, 0, 0);
  return d;
}

export function useTrafficAlerts(events: CalendarEvent[]) {
  const [alerts, setAlerts] = useState<TrafficAlert[]>([]);

  const checkAlerts = useCallback(() => {
    const now = new Date();
    const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    const newAlerts: TrafficAlert[] = [];

    events.forEach(event => {
      if (!event.location) return;
      if (!isToday(parseISO(event.date))) return;

      const eventStart = timeToDate(event.date, event.startTime);

      // Only alert if event is within 3 hours
      if (eventStart > now && eventStart <= threeHoursFromNow) {
        const delay = getRandomDelay();
        newAlerts.push({
          eventId: event.id,
          delayMinutes: delay,
          severity: delay > 30 ? 'danger' : 'warning',
          routeUrl: buildGoogleMapsUrl(event.location),
        });
      }
    });

    setAlerts(newAlerts);
  }, [events]);

  useEffect(() => {
    checkAlerts();
    const interval = setInterval(checkAlerts, 5 * 60 * 1000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, [checkAlerts]);

  const getAlertForEvent = useCallback((eventId: string): TrafficAlert | undefined => {
    return alerts.find(a => a.eventId === eventId);
  }, [alerts]);

  const formatDepartureTime = useCallback((event: CalendarEvent, delayMinutes: number): string => {
    const eventStart = timeToDate(event.date, event.startTime);
    const suggestedDeparture = new Date(eventStart.getTime() - (delayMinutes + 30) * 60 * 1000);
    return format(suggestedDeparture, 'h:mm a');
  }, []);

  return {
    alerts,
    getAlertForEvent,
    formatDepartureTime,
    refreshAlerts: checkAlerts,
  };
}
