import { useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen, PrimaryButton, Badge } from '../../components/UI';
import { Notice, ErrorText, statusColor } from '../../components/Organizer';
import { useWorkspace } from '../../state/Workspace';
import { ui } from '../../theme';
export default function AlertDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useWorkspace();
  const a = s.alerts.find((a) => a.id === id);
  const [error, setError] = useState('');
  async function close() {
    setError('');
    try {
      await s.resolveAlert(id, '');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Screen
      back
      title="Obsługa alertu"
      subtitle={s.event?.zones.find((z) => z.id === a?.zone_id)?.name ?? 'Szczegóły zgłoszenia'}
    >
      {a ? (
        <>
          <View style={[ui.card, { gap: 12, marginBottom: 16 }]}>
            <Badge color={statusColor(a.level)}>
              {a.resolved_at ? 'ZAMKNIĘTY' : a.level === 'critical' ? 'KRYTYCZNY' : 'OSTRZEŻENIE'}
            </Badge>
            <Text style={ui.title}>{a.message}</Text>
            <Text style={ui.muted}>{new Date(a.triggered_at).toLocaleString('pl-PL')}</Text>
          </View>
          {a.resolved_at ? (
            <Notice>Zamknięto: {new Date(a.resolved_at).toLocaleString('pl-PL')}</Notice>
          ) : s.authenticated ? (
            <PrimaryButton
              title="Zamknij alert"
              icon="checkmark-circle-outline"
              disabled={s.busy}
              onPress={() => void close()}
            />
          ) : (
            <Notice>Zaloguj się w zakładce Konto, aby zamknąć alert.</Notice>
          )}
          <ErrorText value={error} />
        </>
      ) : (
        <Notice>Alert nie należy do wybranego wydarzenia.</Notice>
      )}
    </Screen>
  );
}
