import { useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { Screen, PrimaryButton } from '../components/UI';
import { Choices, Field, Guard, ErrorText, Notice } from '../components/Organizer';
import { useWorkspace } from '../state/Workspace';
import { type AlertRecord } from '../domain/model';
import { ui } from '../theme';
export default function NewAlert() {
  const s = useWorkspace();
  const [zone, setZone] = useState(s.event?.zones[0]?.id ?? '');
  const [level, setLevel] = useState<AlertRecord['level']>('warning');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  async function save() {
    setError('');
    try {
      await s.createAlert(zone, level, text);
      router.replace('/alerts');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Screen back title="Nowy alert" subtitle={s.event?.name ?? ''}>
      <Guard edit>
        {s.event?.zones.length ? (
          <>
            <Text style={[ui.small, { marginBottom: 10 }]}>Strefa</Text>
            <Choices
              value={zone}
              onChange={setZone}
              options={s.event.zones.map((z) => ({ value: z.id, label: z.name }))}
            />
            <Choices
              value={level}
              onChange={setLevel}
              options={[
                { value: 'warning', label: 'Ostrzeżenie' },
                { value: 'critical', label: 'Krytyczny' },
              ]}
            />
            <Field
              label="Opis alertu"
              value={text}
              onChangeText={setText}
              multiline
              maxLength={500}
              placeholder="Opisz sytuację w strefie…"
            />
            <ErrorText value={error} />
            <PrimaryButton
              title="Zapisz alert"
              icon="warning-outline"
              disabled={s.busy}
              onPress={() => void save()}
            />
          </>
        ) : (
          <Notice>Dodaj najpierw strefę do wydarzenia.</Notice>
        )}
      </Guard>
    </Screen>
  );
}
