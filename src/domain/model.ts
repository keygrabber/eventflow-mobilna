import { initialEventWorkspace, demoHistory } from '../data/web/eventWorkspace.js';
import { demoAlerts, demoChecklist } from '../data/web/alertsDemo.js';
import { validateEvent, validateZone } from './web/validation.js';

export type Role = 'admin' | 'organizer';
export type Source = 'demo' | 'live';
export interface Profile {
  name: string;
  email: string;
  organization: string;
  role: Role;
}
export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface Zone {
  type?: string;
  id: string;
  name: string;
  capacity: number;
  current_count: number;
  alert_threshold: number;
  area?: Area;
}
export interface Event {
  id: string;
  name: string;
  venue: string;
  start_at: string;
  end_at: string;
  max_capacity: number;
  status: 'planned' | 'active' | 'ended';
  zones: Zone[];
}
export interface AlertRecord {
  id: string;
  event_id: string;
  zone_id: string;
  level: 'warning' | 'critical';
  message: string;
  triggered_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_note: string;
  completed_steps: string[];
  source: Source;
}
export interface Settings {
  warning: number;
  critical: number;
  showWarning: boolean;
  showCritical: boolean;
}
export interface Workspace {
  version: 2;
  selectedEventId: string;
  events: Event[];
  alerts: AlertRecord[];
  settings: Settings;
}
export const roles = { organizer: 'Organizator', admin: 'Administrator' };
export const statuses = { planned: 'Planowane', active: 'Aktywne', ended: 'Zakończone' };
export const checklist = demoChecklist;
export const histories = demoHistory;
export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
export function createWorkspace(): Workspace {
  const zoneIds: Record<string, string> = {
    'demo-zone-a': 'demo-stage',
    'demo-zone-b': 'demo-food',
    'demo-zone-c': 'demo-gate',
  };
  return {
    version: 2,
    selectedEventId: initialEventWorkspace.selectedEventId,
    events: clone(initialEventWorkspace.events) as Event[],
    alerts: clone(demoAlerts).map((a) => ({
      ...a,
      event_id: 'demo-festival',
      zone_id: zoneIds[a.zone_id],
    })) as AlertRecord[],
    settings: { warning: 70, critical: 90, showWarning: true, showCritical: true },
  };
}
export const uid = (kind: string) =>
  `demo-${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
export const number = (value: number) =>
  value.toLocaleString('pl-PL', { maximumFractionDigits: 0 });
export function zoneStatus(zone: Zone, warning = 70) {
  const percent = (zone.current_count / zone.capacity) * 100;
  const level =
    percent >= zone.alert_threshold ? 'critical' : percent >= warning ? 'warning' : 'safe';
  return {
    percent,
    level,
    label: level === 'critical' ? 'Krytyczna' : level === 'warning' ? 'Uwaga' : 'Bezpieczna',
  };
}
export function eventErrors(event: Omit<Event, 'id' | 'zones'>) {
  return Object.values(validateEvent(event)).map(String);
}
export function zoneErrors(zone: Omit<Zone, 'id'>, others: Zone[]) {
  return Object.values(validateZone(zone, others)).map(String);
}
export function requireEditor(profile: Profile | null, source: Source) {
  if (!profile || !['admin', 'organizer'].includes(profile.role))
    throw new Error('Wybierz profil administratora lub organizatora.');
  if (source !== 'demo')
    throw new Error('API udostępnia monitoring. Edycja jest dostępna w danych demo.');
}
export function parseWorkspace(raw: string): Workspace {
  const data = JSON.parse(raw) as Workspace;
  if (
    data.version !== 2 ||
    !Array.isArray(data.events) ||
    !data.events.length ||
    !Array.isArray(data.alerts) ||
    !data.settings
  )
    throw new Error('Nieprawidłowy zapis panelu.');
  const ids = new Set<string>();
  for (const event of data.events) {
    if (
      typeof event.id !== 'string' ||
      ids.has(event.id) ||
      eventErrors(event).length ||
      !Array.isArray(event.zones)
    )
      throw new Error('Nieprawidłowe wydarzenie.');
    ids.add(event.id);
    for (const zone of event.zones) {
      if (
        typeof zone.id !== 'string' ||
        ids.has(zone.id) ||
        zoneErrors(
          zone,
          event.zones.filter((z) => z.id !== zone.id),
        ).length ||
        !Number.isInteger(zone.current_count) ||
        zone.current_count < 0
      )
        throw new Error('Nieprawidłowa strefa.');
      ids.add(zone.id);
    }
  }
  if (!data.events.some((e) => e.id === data.selectedEventId))
    throw new Error('Nieprawidłowy wybór wydarzenia.');
  const alertIds = new Set<string>();
  for (const alert of data.alerts) {
    const event = data.events.find((e) => e.id === alert.event_id);
    if (
      typeof alert.id !== 'string' ||
      alertIds.has(alert.id) ||
      !event?.zones.some((z) => z.id === alert.zone_id) ||
      alert.source !== 'demo' ||
      !['warning', 'critical'].includes(alert.level) ||
      typeof alert.message !== 'string' ||
      !Number.isFinite(Date.parse(alert.triggered_at)) ||
      !Array.isArray(alert.completed_steps) ||
      !alert.completed_steps.every((id) => checklist.some((c) => c.id === id)) ||
      typeof alert.resolution_note !== 'string' ||
      (alert.resolved_at !== null && !Number.isFinite(Date.parse(alert.resolved_at)))
    )
      throw new Error('Nieprawidłowy alert.');
    alertIds.add(alert.id);
  }
  validateSettings(data.settings);
  return data;
}
export function validateSettings(s: Settings) {
  if (
    !Number.isInteger(s.warning) ||
    !Number.isInteger(s.critical) ||
    s.warning < 1 ||
    s.critical < 71 ||
    s.critical > 100 ||
    s.warning >= s.critical ||
    typeof s.showWarning !== 'boolean' ||
    typeof s.showCritical !== 'boolean'
  )
    throw new Error(
      'Progi muszą być całkowite: 1 ≤ ostrzeganie < krytyczny ≤ 100; próg krytyczny minimum 71%.',
    );
}
export function simulationContext(event: Event) {
  const zones = event.zones.map((z) => {
    const name = z.name.toLowerCase();
    const type = /scena|stage/.test(name)
      ? 'stage'
      : /wejście|gate|bramk/.test(name)
        ? 'entrance'
        : /wyjście|exit|parking/.test(name)
          ? 'exit'
          : 'other';
    return {
      id: z.id,
      name: z.name,
      shortName: z.name,
      type,
      capacity: z.capacity,
      currentCount: z.current_count,
    };
  });
  return { mode: 'workspace', event: { id: event.id, name: event.name }, zones };
}
