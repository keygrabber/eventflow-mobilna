import { useEffect, useState } from 'react';
import { api } from '../../domain/api';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen, Section, PrimaryButton, Badge } from '../../components/UI';
import { Bars, Metric, Notice, Progress, statusColor } from '../../components/Organizer';
import { useWorkspace } from '../../state/Workspace';
import { number, zoneStatus } from '../../domain/model';
import { ui } from '../../theme';
export default function ZoneRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ZoneDetail key={id} id={id} />;
}
function ZoneDetail({ id }: { id: string }) {
  const s = useWorkspace();
  const z = s.event?.zones.find((z) => z.id === id);
  const state = z ? zoneStatus(z, s.workspace.settings.warning) : null;
  const [history, setHistory] = useState<{ count: number; logged_at: string }[]>([]);
  const [historyError, setHistoryError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    api<{ samples: { count: number; logged_at: string }[] }>(`/zones/${id}/history?limit=100`, {
      signal: controller.signal,
    })
      .then((data) => setHistory(data.samples))
      .catch((e) => {
        if (!controller.signal.aborted) setHistoryError(e.message);
      });
    return () => controller.abort();
  }, [id]);
  return (
    <Screen
      back
      title={z?.name ?? 'Strefa niedostępna'}
      subtitle={s.event?.name ?? 'Szczegóły strefy'}
    >
      {z && state ? (
        <>
          <View style={[ui.card, { gap: 12 }]}>
            <Badge color={statusColor(state.level)}>{state.label}</Badge>
            <Text style={ui.title}>{number(z.current_count)} osób</Text>
            <Progress percent={state.percent} color={statusColor(state.level)} />
            <Text style={ui.small}>{Math.round(state.percent)}% pojemności</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
            <Metric label="pojemność strefy" value={number(z.capacity)} />
            <Metric label="próg krytyczny" value={`${z.alert_threshold}%`} />
          </View>
          <Section number="01" title="Historia pomiarów" />
          {history.length ? (
            <>
              <Text style={ui.muted}>
                Pomiary z bazy danych. Pojemność według bieżącej konfiguracji.
              </Text>
              <Bars
                data={history.map((p: { count: number; logged_at: string }) => ({
                  label: new Date(p.logged_at).toLocaleTimeString('pl-PL', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  value: p.count,
                }))}
              />
            </>
          ) : (
            <Notice>{historyError || 'Brak historii pomiarów dla tej strefy.'}</Notice>
          )}
          {s.authenticated && (
            <PrimaryButton
              title="Edytuj strefę"
              icon="create-outline"
              onPress={() => router.push({ pathname: '/zone-editor', params: { id } })}
            />
          )}
        </>
      ) : (
        <Notice>Strefa nie należy do bieżącego wydarzenia.</Notice>
      )}
    </Screen>
  );
}
