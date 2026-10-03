import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen, PrimaryButton } from '../components/UI';
import { Field, Choices, ErrorText, Notice } from '../components/Organizer';
import { useWorkspace } from '../state/Workspace';
import { statuses, type Event } from '../domain/model';
function localDate(value?: string) {
  if (!value) return undefined;
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return undefined;
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export default function EventEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const s = useWorkspace();
  const old = s.events.find((e) => e.id === id);
  const [name, setName] = useState(old?.name ?? '');
  const [venue, setVenue] = useState(old?.venue ?? '');
  const [start, setStart] = useState(localDate(old?.start_at) ?? '2026-10-10T09:00');
  const [end, setEnd] = useState(localDate(old?.end_at) ?? '2026-10-10T18:00');
  const [capacity, setCapacity] = useState(String(old?.max_capacity ?? 3000));
  const [status, setStatus] = useState<Event['status']>(old?.status ?? 'planned');
  const [error, setError] = useState('');
  async function save() {
    setError('');
    try {
      await s.saveEvent(id, {
        name,
        venue,
        start_at: start,
        end_at: end,
        max_capacity: Number(capacity),
        status,
      });
      router.replace('/events');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Screen
      back
      title={id ? 'Edytuj wydarzenie' : 'Nowe wydarzenie'}
      subtitle="Dane i ustawienia wydarzenia."
    >
      {!s.authenticated || (id && !old) ? (
        <Notice>Wydarzenie nie jest dostępne do edycji.</Notice>
      ) : (
        <>
          <Field label="Nazwa wydarzenia" value={name} onChangeText={setName} maxLength={200} />
          <Field label="Miejsce" value={venue} onChangeText={setVenue} maxLength={200} />
          <Field
            label="Początek (RRRR-MM-DDTHH:mm)"
            value={start}
            onChangeText={setStart}
            placeholder="2026-10-10T09:00"
          />
          <Field
            label="Koniec (RRRR-MM-DDTHH:mm)"
            value={end}
            onChangeText={setEnd}
            placeholder="2026-10-10T18:00"
          />
          <Notice>
            Godziny w lokalnej strefie czasowej urządzenia. Nowe wydarzenie zaczyna się bez stref i
            pomiarów.
          </Notice>
          <Field
            label="Maksymalna liczba uczestników"
            value={capacity}
            onChangeText={setCapacity}
            keyboardType="number-pad"
          />
          <Choices
            value={status}
            onChange={setStatus}
            options={Object.entries(statuses).map(([value, label]) => ({
              value: value as Event['status'],
              label,
            }))}
          />
          <ErrorText value={error} />
          <PrimaryButton
            title="Zapisz wydarzenie"
            icon="checkmark"
            disabled={s.busy || !!s.storageError}
            onPress={() => void save()}
          />
        </>
      )}
    </Screen>
  );
}
