import type { AlertRecord, Event, Zone } from './model.ts';
import { api } from './api.ts';
export { API_URL } from './api.ts';
const record = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== 'object') throw new Error('Nieprawidłowy format API.');
  return v as Record<string, unknown>;
};
function positive(v: unknown, zero = false) {
  const n = Number(v);
  if (v === null || v === '' || !Number.isFinite(n) || n < (zero ? 0 : 1))
    throw new Error('Nieprawidłowy pomiar API.');
  return n;
}
export function parseLiveEvents(value: unknown): Event[] {
  if (!Array.isArray(value)) throw new Error('API nie zwróciło listy wydarzeń.');
  return value.map((item) => {
    const e = record(item);
    if (typeof e.id !== 'string' || typeof e.name !== 'string' || !Array.isArray(e.zones))
      throw new Error('Nieprawidłowe wydarzenie API.');
    const zones: Zone[] = e.zones.map((item) => {
      const z = record(item);
      if (typeof z.id !== 'string' || typeof z.name !== 'string')
        throw new Error('Nieprawidłowa strefa API.');
      const a = z.area ? record(z.area) : undefined;
      return {
        id: z.id,
        name: z.name,
        type: String(z.type ?? 'other'),
        capacity: positive(z.capacity),
        current_count: positive(z.current_count ?? 0, true),
        alert_threshold: positive(z.alert_threshold ?? 90),
        ...(a && ['x', 'y', 'width', 'height'].every((k) => Number.isFinite(Number(a[k])))
          ? {
              area: {
                x: Number(a.x),
                y: Number(a.y),
                width: Number(a.width),
                height: Number(a.height),
              },
            }
          : {}),
      };
    });
    return {
      id: e.id,
      name: e.name,
      venue: String(e.venue ?? ''),
      start_at: String(e.start_at ?? ''),
      end_at: String(e.end_at ?? ''),
      max_capacity: positive(e.max_capacity),
      status: e.status as Event['status'],
      zones,
    };
  });
}
export async function fetchLive(eventId: string | undefined, signal?: AbortSignal) {
  const events = parseLiveEvents(await api('/events', { signal }));
  const selected =
    events.find((e) => e.id === eventId) ?? events.find((e) => e.status === 'active') ?? events[0];
  if (!selected) return { events, selectedEventId: '', alerts: [] as AlertRecord[] };
  const payload = await api<unknown[]>(`/events/${encodeURIComponent(selected.id)}/alerts`, {
    signal,
  });
  if (!Array.isArray(payload)) throw new Error('Nieprawidłowa lista alertów.');
  const alerts: AlertRecord[] = payload.map((item) => {
    const a = record(item);
    if (
      typeof a.id !== 'string' ||
      typeof a.zone_id !== 'string' ||
      !selected.zones.some((z) => z.id === a.zone_id) ||
      !['warning', 'critical'].includes(String(a.level))
    )
      throw new Error('Nieprawidłowy alert API.');
    return {
      id: a.id,
      event_id: selected.id,
      zone_id: a.zone_id,
      level: a.level as AlertRecord['level'],
      message: String(a.message ?? ''),
      triggered_at: String(a.triggered_at ?? ''),
      resolved_at: a.resolved_at ? String(a.resolved_at) : null,
      resolved_by: a.resolver ? String(record(a.resolver).name) : null,
      resolution_note: '',
      completed_steps: [],
      source: 'live',
    };
  });
  return { events, alerts, selectedEventId: selected.id };
}
