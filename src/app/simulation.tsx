import { api } from '../domain/api';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Screen, Section, PrimaryButton } from '../components/UI';
import {
  ContextBar,
  Guard,
  Choices,
  Field,
  ErrorText,
  Metric,
  Bars,
  Notice,
} from '../components/Organizer';
import { useWorkspace } from '../state/Workspace';
import { simulationContext, type Event } from '../domain/model';
import { calculateSimulation, validateSimulationInput } from '../domain/web/simulation';
import { colors, ui } from '../theme';
function SimulationForm({ event }: { event: Event }) {
  const { authenticated } = useWorkspace();
  const [context, setContext] = useState<ReturnType<typeof simulationContext>>({
    mode: 'live',
    event: { id: event.id, name: event.name },
    zones: [],
  });
  const [loading, setLoading] = useState(true);

  const [scenario, setScenario] = useState('entrance_closure');
  const [zone, setZone] = useState(context.zones.find((z) => z.type === 'entrance')?.id ?? '');
  const [people, setPeople] = useState('1000');
  const [duration, setDuration] = useState('15');
  const [result, setResult] = useState<ReturnType<typeof calculateSimulation> | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    api<ReturnType<typeof simulationContext>>(`/events/${event.id}/simulations/context`, {
      signal: controller.signal,
    })
      .then((c) => {
        setContext(c);
        setZone(c.zones.find((z) => z.type === 'entrance')?.id ?? '');
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [event.id]);
  const candidates = context.zones.filter(
    (z) => z.type === (scenario === 'entrance_closure' ? 'entrance' : 'stage'),
  );
  function invalidate() {
    setResult(null);
    setError('');
  }
  async function run() {
    invalidate();
    const input = {
      eventId: event.id,
      scenario,
      zoneId: zone,
      peopleCount: Number(people),
      durationMinutes: Number(duration),
    };
    const errors = Object.values(validateSimulationInput(input, context));
    if (errors.length) {
      setError(String(errors[0]));
      return;
    }
    if (event.zones.length < 2) {
      setError('Potrzebne są przynajmniej dwie strefy.');
      return;
    }
    setLoading(true);
    try {
      setResult(
        await api<ReturnType<typeof calculateSimulation>>('/simulations/run', {
          method: 'POST',
          body: input,
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      {!authenticated && (
        <Notice>Zaloguj się, aby uruchomić i zapisać symulację na serwerze.</Notice>
      )}
      <Section number="01" title="Scenariusz" />
      <Choices
        value={scenario}
        onChange={(v) => {
          setScenario(v);
          setZone(
            context.zones.find((z) => z.type === (v === 'entrance_closure' ? 'entrance' : 'stage'))
              ?.id ?? '',
          );
          invalidate();
        }}
        options={[
          { value: 'entrance_closure', label: 'Zamknięcie wejścia' },
          { value: 'concert_end', label: 'Koniec koncertu' },
        ]}
      />
      <Text style={[ui.small, { marginBottom: 10 }]}>Strefa źródłowa</Text>
      <Choices
        value={zone}
        onChange={(v) => {
          setZone(v);
          invalidate();
        }}
        options={candidates.map((z) => ({ value: z.id, label: z.name }))}
      />
      {!candidates.length && (
        <Notice>
          Brak strefy tego typu. Scenariusz wymaga strefy ze słowem „Wejście” lub „Scena” w nazwie.
        </Notice>
      )}
      <Field
        label="Liczba przemieszczających się osób"
        value={people}
        onChangeText={(v) => {
          setPeople(v);
          invalidate();
        }}
        keyboardType="number-pad"
      />
      <Field
        label="Czas symulacji (minuty)"
        value={duration}
        onChangeText={(v) => {
          setDuration(v);
          invalidate();
        }}
        keyboardType="number-pad"
      />
      <ErrorText value={error} />
      <PrimaryButton
        title="Uruchom symulację"
        icon="play-outline"
        disabled={!candidates.length || loading || !authenticated}
        onPress={() => void run()}
      />
      {result && (
        <>
          <Section number="02" title="Wyniki scenariusza" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <Metric
              label="szczyt obciążenia*"
              value={`${result.summary.peakOccupancyPercent}%`}
              color={colors.amber}
            />
            <Metric label="stref ze wzrostem do ≥90%" value={String(result.summary.zonesAtRisk)} />
            <Metric
              label="czas do progu 90%*"
              value={
                result.summary.timeToOverloadMinutes === null
                  ? '—'
                  : `${result.summary.timeToOverloadMinutes} min`
              }
            />
          </View>
          <Text style={[ui.muted, { marginTop: 10 }]}>
            * W strefie z największym przyrostem obciążenia.
          </Text>
          <Bars
            data={result.timeline.map((p: { minute: number; occupancyPercent: number }) => ({
              label: `${p.minute} min`,
              value: p.occupancyPercent,
            }))}
            suffix="%"
          />
          <Section number="03" title="Przed i po" />
          {result.zones.map(
            (z: { zoneId: string; name: string; beforePercent: number; afterPercent: number }) => (
              <View key={z.zoneId} style={[ui.card, { gap: 8, marginBottom: 10 }]}>
                <Text style={ui.text}>{z.name}</Text>
                <Text style={ui.small}>
                  {z.beforePercent}% → {z.afterPercent}%
                </Text>
              </View>
            ),
          )}
          <Section number="04" title="Kierunek przepływu" />
          <Notice>
            {context.zones.find((z) => z.id === result.flow.sourceZoneId)?.name}
            {' → '}
            {result.flow.destinationZoneIds
              .map((id: string) => context.zones.find((z) => z.id === id)?.name)
              .join(', ')}
          </Notice>
          <Notice>{result.flow.recommendation}</Notice>
        </>
      )}
      <Text style={[ui.muted, { marginTop: 16 }]}>
        Model poglądowy z aplikacji webowej. Typy stref są rozpoznawane po nazwach. Wynik nie
        zmienia pomiarów ani alertów.
      </Text>
    </>
  );
}
export default function Simulation() {
  const s = useWorkspace();
  return (
    <Screen back title="Symulacja przepływu" subtitle="Sprawdź scenariusz przed podjęciem decyzji.">
      <ContextBar />
      <Guard>
        {s.event && <SimulationForm key={`${s.source}-${s.event.id}`} event={s.event} />}
      </Guard>
    </Screen>
  );
}
