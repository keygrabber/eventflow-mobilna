import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createWorkspace,
  parseWorkspace,
  eventErrors,
  zoneErrors,
  requireEditor,
  simulationContext,
  histories,
  validateSettings,
  zoneStatus,
} from '../src/domain/model.ts';
import { parseLiveEvents, fetchLive } from '../src/domain/live.ts';
import { buildEventReport, reportToCsv, validateReportRange } from '../src/domain/web/reports.js';
import { calculateSimulation, validateSimulationInput } from '../src/domain/web/simulation.js';
const fixture = createWorkspace();
const festival = fixture.events[0];
test('web data are copied without sharing mutable references and alerts belong to their event', () => {
  assert.equal(festival.name, 'Rock Festival Kraków');
  assert.equal(festival.zones.length, 8);
  assert.equal(
    festival.zones.reduce((n, z) => n + z.current_count, 0),
    20502,
  );
  assert.equal(fixture.events.length, 2);
  for (const a of fixture.alerts) {
    assert.equal(a.event_id, festival.id);
    assert.ok(festival.zones.some((z) => z.id === a.zone_id));
  }
  const changed = createWorkspace();
  changed.events[0].zones[0].current_count = 0;
  assert.equal(createWorkspace().events[0].zones[0].current_count, 7800);
  assert.deepEqual(parseWorkspace(JSON.stringify(fixture)), fixture);
});
test('invalid persisted data cannot overwrite the workspace', () => {
  const broken = createWorkspace();
  broken.events[0].zones[0].capacity = 0;
  assert.throws(() => parseWorkspace(JSON.stringify(broken)));
  assert.throws(() => parseWorkspace('{invalid'));
  const cross = createWorkspace();
  cross.alerts[0].event_id = cross.events[1].id;
  assert.throws(() => parseWorkspace(JSON.stringify(cross)));
});
test('event dates, capacities, zone geometry and duplicate names are validated', () => {
  assert.ok(eventErrors({ ...festival, end_at: festival.start_at }).length);
  assert.ok(eventErrors({ ...festival, start_at: '2026-02-30T12:00' }).length);
  assert.ok(eventErrors({ ...festival, max_capacity: 1.5 }).length);
  const zone = festival.zones[0];
  assert.ok(zoneErrors({ ...zone, name: 'Scena Boczna' }, festival.zones.slice(1)).length);
  assert.ok(zoneErrors({ ...zone, area: { x: 95, y: 0, width: 10, height: 10 } }, []).length);
  assert.ok(zoneErrors({ ...zone, name: 'Test' }, [zone]).length);
  assert.equal(zoneErrors(zone, festival.zones.slice(1)).length, 0);
});
test('only selected demo organizer/admin can write; live monitoring never grants writes', () => {
  for (const role of ['admin', 'organizer'] as const) {
    const p = { role, name: 'Test', email: 'test@example.test', organization: 'Demo' };
    assert.doesNotThrow(() => requireEditor(p, 'demo'));
    assert.throws(() => requireEditor(p, 'live'));
  }
  assert.throws(() => requireEditor(null, 'demo'));
});
test('threshold preferences remain valid for newly created zones', () => {
  assert.throws(() => validateSettings({ ...fixture.settings, warning: 95, critical: 90 }));
  assert.throws(() => validateSettings({ ...fixture.settings, critical: 65 }));
  assert.equal(zoneStatus(festival.zones.find((z) => z.id === 'demo-gate')!).level, 'critical');
});
test('report includes simultaneous measurements; empty periods do not fabricate samples', () => {
  const report = buildEventReport(festival, histories, { from: '2026-10-01', to: '2026-10-01' });
  assert.equal(report.summary.samples, 96);
  assert.equal(report.summary.peak_count, 20502);
  assert.equal(report.summary.measured_zones, 8);
  assert.equal(report.summary.partial, false);
  const empty = buildEventReport(festival, histories, { from: '2026-10-02', to: '2026-10-02' });
  assert.equal(empty.summary.peak_count, null);
  assert.throws(() => reportToCsv(empty));
  assert.ok(Object.keys(validateReportRange({ from: '2026-02-30', to: '2026-03-01' })).length);
});
test('CSV exports include BOM, Polish headings, escaped formulas and individual measurements', () => {
  const e = { ...festival, name: '=SUM(A1)' };
  const report = buildEventReport(e, histories, { from: '2026-10-01', to: '2026-10-01' });
  const csv = reportToCsv(report);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes("'=SUM(A1)"));
  assert.equal(reportToCsv(report, 'measurements').split('\r\n').length, 98);
});
test('simulation reacts to participant count without mutating observed data', () => {
  const ctx = simulationContext(festival);
  const input = {
    scenario: 'entrance_closure',
    eventId: festival.id,
    zoneId: 'demo-gate',
    peopleCount: 1000,
    durationMinutes: 15,
  };
  assert.deepEqual(validateSimulationInput(input, ctx), {});
  const snapshot = JSON.stringify(ctx);
  const first = calculateSimulation(input, ctx);
  const second = calculateSimulation({ ...input, peopleCount: 2000 }, ctx);
  assert.ok(second.summary.peakOccupancyPercent > first.summary.peakOccupancyPercent);
  assert.equal(JSON.stringify(ctx), snapshot);
  assert.ok(Object.keys(validateSimulationInput({ ...input, zoneId: 'demo-food' }, ctx)).length);
  assert.ok(Object.keys(validateSimulationInput({ ...input, peopleCount: 0 }, ctx)).length);
});
test('live response validation rejects missing or invalid measurements', () => {
  assert.deepEqual(parseLiveEvents([]), []);
  assert.throws(() => parseLiveEvents({ data: [] }));
  assert.throws(() =>
    parseLiveEvents([{ ...festival, zones: [{ ...festival.zones[0], current_count: -1 }] }]),
  );
  assert.ok(parseLiveEvents([festival])[0].zones[0].area);
  const withoutArea = { ...festival, zones: [{ ...festival.zones[0], area: undefined }] };
  assert.equal(parseLiveEvents([withoutArea])[0].zones[0].area, undefined);
});
test('live loading uses GET and never mixes demo alerts on empty response or error', async () => {
  const original = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = (async (url: unknown) => {
    calls.push(String(url));
    return new Response(JSON.stringify(calls.length === 1 ? [festival] : []), { status: 200 });
  }) as typeof fetch;
  try {
    const value = await fetchLive(festival.id, new AbortController().signal);
    assert.equal(value.alerts.length, 0);
    assert.equal(value.selectedEventId, festival.id);
    assert.equal(calls.length, 2);
    globalThis.fetch = (async () => new Response('', { status: 500 })) as typeof fetch;
    await assert.rejects(() => fetchLive(undefined, new AbortController().signal), /HTTP 500/);
  } finally {
    globalThis.fetch = original;
  }
});
