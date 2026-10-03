import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Section, Action, Icon } from '../../components/UI';
import {
  ContextBar,
  Guard,
  Metric,
  Progress,
  ZoneCard,
  AlertCard,
} from '../../components/Organizer';
import { useWorkspace } from '../../state/Workspace';
import { number, roles } from '../../domain/model';
import { colors, serif, ui } from '../../theme';
export default function Dashboard() {
  const s = useWorkspace();
  const e = s.event;
  const total = e?.zones.reduce((n, z) => n + z.current_count, 0) ?? 0;
  const active = s.alerts.filter((a) => !a.resolved_at);
  const visibleAlerts = active.filter((a) =>
    a.level === 'critical' ? s.workspace.settings.showCritical : s.workspace.settings.showWarning,
  );
  const percent = e ? Math.round((total / e.max_capacity) * 100) : 0;
  return (
    <Screen
      title="Przegląd wydarzenia"
      subtitle={
        s.authenticated && s.profile
          ? `${roles[s.profile.role]} · ${s.profile.name}`
          : 'Aktualne dane z bazy EventFlow'
      }
    >
      <ContextBar />
      <Guard>
        {e && (
          <>
            <View style={[ui.card, { backgroundColor: colors.teal, padding: 20 }]}>
              <View style={ui.between}>
                <Text style={ui.small}>UCZESTNICY NA TERENIE</Text>
                <Icon name="people-outline" />
              </View>
              <Text style={{ fontFamily: serif, fontSize: 48, color: colors.text, marginTop: 12 }}>
                {number(total)}
              </Text>
              <Text style={ui.small}>z {number(e.max_capacity)} dostępnych miejsc</Text>
              <Progress percent={percent} />
              <Text style={ui.small}>
                {percent}% pojemności · {e.venue}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
              <Metric label="monitorowanych stref" value={String(e.zones.length)} />
              <Metric
                label="aktywnych alertów"
                value={String(active.length)}
                color={active.length ? colors.amber : colors.green}
              />
            </View>
            <Section number="01" title="Szybkie działania" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {(
                [
                  { label: 'Strefy', path: '/map', icon: 'map-outline' },
                  { label: 'Wydarzenia', path: '/events', icon: 'calendar-outline' },
                  { label: 'Symulacja', path: '/simulation', icon: 'git-network-outline' },
                  { label: 'Raporty', path: '/reports', icon: 'bar-chart-outline' },
                ] as const
              ).map((a) => (
                <Action
                  key={a.path}
                  label={a.label}
                  onPress={() => router.push(a.path)}
                  style={[
                    ui.card,
                    { width: '48%', alignItems: 'center', gap: 9, paddingVertical: 18 },
                  ]}
                >
                  <Icon name={a.icon} />
                  <Text style={ui.small}>{a.label}</Text>
                </Action>
              ))}
            </View>
            <Section
              number="02"
              title="Największe obciążenie"
              action="Wszystkie"
              onPress={() => router.push('/map')}
            />
            {[...e.zones]
              .sort((a, b) => b.current_count / b.capacity - a.current_count / a.capacity)
              .slice(0, 3)
              .map((z) => (
                <ZoneCard key={z.id} zone={z} />
              ))}
            <Section
              number="03"
              title="Ostatnie alerty"
              action="Zobacz alerty"
              onPress={() => router.push('/alerts')}
            />
            {visibleAlerts.slice(0, 2).map((a) => (
              <AlertCard key={a.id} alert={a} />
            ))}
            {!visibleAlerts.length && (
              <Text style={ui.small}>
                {active.length
                  ? 'Alerty są ukryte przez preferencje przeglądu. Pełna lista w zakładce Alerty.'
                  : 'Brak aktywnych alertów.'}
              </Text>
            )}
          </>
        )}
      </Guard>
    </Screen>
  );
}
