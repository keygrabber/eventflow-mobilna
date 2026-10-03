import { useState, type PropsWithChildren } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { router } from 'expo-router';
import { Action, Badge, Icon, Sheet } from './UI';
import { colors, ui } from '../theme';
import { useWorkspace } from '../state/Workspace';
import { number, zoneStatus, type Zone, type AlertRecord } from '../domain/model';

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 7, marginBottom: 14 }}>
      <Text style={ui.small}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        selectionColor={colors.cyan}
        autoCapitalize="none"
        {...props}
        style={[
          {
            color: colors.text,
            backgroundColor: colors.raised,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 11,
            padding: 12,
            minHeight: 48,
            fontSize: 15,
          },
          props.multiline && { minHeight: 100, textAlignVertical: 'top' },
          props.style,
        ]}
      />
    </View>
  );
}
export function Choices<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          accessibilityRole="radio"
          accessibilityLabel={o.label}
          accessibilityState={{ checked: o.value === value }}
          onPress={() => onChange(o.value)}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 12,
            minHeight: 44,
            backgroundColor: o.value === value ? colors.teal : colors.raised,
            borderWidth: 1,
            borderColor: o.value === value ? colors.cyan : colors.border,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: o.value === value ? colors.cyan : colors.secondary, fontSize: 12 }}>
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
export function Notice({ children, error = false }: PropsWithChildren<{ error?: boolean }>) {
  return (
    <View
      style={[ui.card, { backgroundColor: error ? colors.redBg : colors.teal, marginBottom: 14 }]}
    >
      <Text
        accessibilityLiveRegion="polite"
        style={[ui.small, { color: error ? colors.red : colors.secondary }]}
      >
        {children}
      </Text>
    </View>
  );
}
export function ErrorText({ value }: { value: string }) {
  return value ? <Notice error>{value}</Notice> : null;
}
export function ContextBar() {
  const s = useWorkspace();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Action
        label="Wybierz wydarzenie"
        onPress={() => setOpen(true)}
        style={[ui.card, ui.between, { marginBottom: 14 }]}
      >
        <View style={ui.grow}>
          <Text style={ui.muted}>BIEŻĄCE WYDARZENIE</Text>
          <Text style={[ui.text, { marginTop: 5 }]}>
            {s.event?.name ?? (s.live.loading ? 'Wczytywanie…' : 'Brak wydarzenia')}
          </Text>
        </View>
        <Icon name="chevron-down" />
      </Action>
      {!!s.storageError && (
        <>
          <Notice error>{s.storageError}</Notice>
          <Action label="Ponów odczyt" onPress={() => void s.reload()}>
            <Text style={ui.cyan}>Ponów odczyt</Text>
          </Action>
        </>
      )}
      {s.source === 'live' && (
        <>
          <Text style={[ui.muted, { marginBottom: 10 }]}>
            {s.live.loading
              ? 'Odświeżanie API…'
              : s.live.fetchedAt
                ? `Odczyt: ${new Date(s.live.fetchedAt).toLocaleTimeString('pl-PL')}`
                : 'Oczekiwanie na API'}{' '}
            · baza danych
          </Text>
          {!!s.live.error && (
            <>
              <Notice error>
                {s.live.error}
                {s.live.fetchedAt ? ' Pokazujemy ostatnio odebrane dane.' : ''}
              </Notice>
              <Action label="Ponów połączenie" onPress={s.refresh}>
                <Text style={ui.cyan}>Ponów połączenie</Text>
              </Action>
            </>
          )}
        </>
      )}
      <Sheet title="Wybierz wydarzenie" visible={open} onClose={() => setOpen(false)}>
        {s.events.map((e) => (
          <Action
            key={e.id}
            label={`Wybierz: ${e.name}`}
            disabled={s.busy}
            onPress={() =>
              void s
                .selectEvent(e.id)
                .then(() => setOpen(false))
                .catch((e) => s.notify(e.message))
            }
            style={[ui.card, { marginBottom: 10 }]}
          >
            <Text style={ui.text}>{e.name}</Text>
            <Text style={ui.muted}>
              {e.venue}
              {e.id === s.event?.id ? ' · wybrane' : ''}
            </Text>
          </Action>
        ))}
        {!s.events.length && (
          <Text style={ui.small}>
            {s.live.loading ? 'Wczytywanie wydarzeń…' : s.live.error || 'Brak wydarzeń w API.'}
          </Text>
        )}
      </Sheet>
    </>
  );
}
export function Guard({ children, edit = false }: PropsWithChildren<{ edit?: boolean }>) {
  const s = useWorkspace();
  if (!s.event)
    return (
      <Notice>
        Brak wydarzenia. Sprawdź połączenie z API lub dodaj wydarzenie w zakładce Eventy.
      </Notice>
    );
  if (edit && !s.authenticated)
    return <Notice>Zaloguj się w zakładce Konto, aby zapisać zmiany w bazie.</Notice>;
  return <>{children}</>;
}
export function Metric({
  label,
  value,
  color = colors.cyan,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={[ui.card, { flex: 1, minWidth: 115, gap: 6 }]}>
      <Text style={{ color, fontSize: 25, fontWeight: '600' }}>{value}</Text>
      <Text style={ui.muted}>{label}</Text>
    </View>
  );
}
export function Progress({ percent, color = colors.cyan }: { percent: number; color?: string }) {
  return (
    <View
      style={{
        height: 6,
        backgroundColor: colors.raised,
        borderRadius: 5,
        overflow: 'hidden',
        marginVertical: 10,
      }}
    >
      <View
        style={{
          height: 6,
          width: `${Math.min(100, Math.max(0, percent))}%`,
          backgroundColor: color,
        }}
      />
    </View>
  );
}
export function statusColor(level: string) {
  return level === 'critical' ? colors.red : level === 'warning' ? colors.amber : colors.green;
}
export function ZoneCard({ zone }: { zone: Zone }) {
  const { workspace, event } = useWorkspace();
  const state = zoneStatus(zone, workspace.settings.warning);
  return (
    <Action
      label={`Strefa: ${zone.name}`}
      onPress={() => router.push(`/zone/${zone.id}`)}
      style={[ui.card, { marginBottom: 10 }]}
    >
      <View style={ui.between}>
        <Text style={[ui.text, ui.grow]}>
          {(event?.zones.findIndex((z) => z.id === zone.id) ?? 0) + 1}. {zone.name}
        </Text>
        <Badge color={statusColor(state.level)} background={colors.raised}>
          {state.label}
        </Badge>
      </View>
      <Progress percent={state.percent} color={statusColor(state.level)} />
      <View style={ui.between}>
        <Text style={ui.small}>
          {number(zone.current_count)} / {number(zone.capacity)} osób
        </Text>
        <Text style={{ color: statusColor(state.level) }}>{Math.round(state.percent)}%</Text>
      </View>
    </Action>
  );
}
export function AlertCard({ alert }: { alert: AlertRecord }) {
  const { event } = useWorkspace();
  return (
    <Action
      label={`Alert: ${alert.message}`}
      onPress={() => router.push(`/alert/${alert.id}`)}
      style={[
        ui.card,
        {
          marginBottom: 10,
          borderLeftWidth: 3,
          borderLeftColor: alert.resolved_at ? colors.green : statusColor(alert.level),
        },
      ]}
    >
      <View style={[ui.between, { marginBottom: 8 }]}>
        <Badge
          color={alert.resolved_at ? colors.green : statusColor(alert.level)}
          background={colors.raised}
        >
          {alert.resolved_at
            ? 'ZAMKNIĘTY'
            : alert.level === 'critical'
              ? 'KRYTYCZNY'
              : 'OSTRZEŻENIE'}
        </Badge>
        <Text style={ui.muted}>
          {new Date(alert.triggered_at).toLocaleTimeString('pl-PL', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      <Text style={ui.text}>{alert.message}</Text>
      <Text style={[ui.muted, { marginTop: 7 }]}>
        {event?.zones.find((z) => z.id === alert.zone_id)?.name ?? 'Strefa'}
      </Text>
    </Action>
  );
}
export function FloorPlan({ zones, interactive = true }: { zones: Zone[]; interactive?: boolean }) {
  const { workspace } = useWorkspace();
  return (
    <View
      style={{
        aspectRatio: 1.2,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        marginBottom: 12,
      }}
    >
      {zones
        .filter((z) => z.area)
        .map((z, i) => {
          const a = z.area!;
          const c = statusColor(zoneStatus(z, workspace.settings.warning).level);
          return (
            <Pressable
              key={z.id}
              disabled={!interactive}
              accessibilityRole="button"
              accessibilityLabel={`Plan: ${z.name}`}
              onPress={() => router.push(`/zone/${z.id}`)}
              style={{
                position: 'absolute',
                left: `${a.x}%`,
                top: `${a.y}%`,
                width: `${a.width}%`,
                height: `${a.height}%`,
                borderWidth: 1,
                borderColor: c,
                backgroundColor: `${c}20`,
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center',
                padding: 3,
              }}
            >
              <Text style={{ color: c, fontSize: 11, textAlign: 'center' }} numberOfLines={2}>
                {a.width < 20 ? `${i + 1}` : z.name}
              </Text>
              <Text style={{ color: c, fontSize: 10 }}>
                {Math.round((z.current_count / z.capacity) * 100)}%
              </Text>
            </Pressable>
          );
        })}
    </View>
  );
}
export function Bars({
  data,
  suffix = '',
}: {
  data: { label: string; value: number }[];
  suffix?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={[ui.card, { marginVertical: 12 }]}>
      {data.map((d, i) => (
        <View key={i} style={{ marginBottom: 8 }}>
          <View style={ui.between}>
            <Text style={ui.muted}>{d.label}</Text>
            <Text style={ui.small}>
              {number(d.value)}
              {suffix}
            </Text>
          </View>
          <Progress percent={(d.value / max) * 100} />
        </View>
      ))}
    </View>
  );
}
