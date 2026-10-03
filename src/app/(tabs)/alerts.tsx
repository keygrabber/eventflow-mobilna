import { useState } from 'react';
import { router } from 'expo-router';
import { Screen, PrimaryButton } from '../../components/UI';
import { AlertCard, Choices, ContextBar, Field, Guard, Notice } from '../../components/Organizer';
import { useWorkspace } from '../../state/Workspace';
export default function Alerts() {
  const s = useWorkspace();
  const [status, setStatus] = useState('active');
  const [level, setLevel] = useState('all');
  const [query, setQuery] = useState('');
  const items = s.alerts.filter(
    (a) =>
      (status === 'all' || (status === 'active' ? !a.resolved_at : !!a.resolved_at)) &&
      (level === 'all' || a.level === level) &&
      `${a.message} ${s.event?.zones.find((z) => z.id === a.zone_id)?.name}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <Screen title="Centrum alertów" subtitle="Sygnały ze stref i działania Twojego zespołu.">
      <ContextBar />
      <Guard>
        <Field label="Szukaj alertu lub strefy" value={query} onChangeText={setQuery} />
        <Choices
          value={status}
          onChange={setStatus}
          options={[
            { value: 'active', label: 'Aktywne' },
            { value: 'resolved', label: 'Zamknięte' },
            { value: 'all', label: 'Wszystkie' },
          ]}
        />
        <Choices
          value={level}
          onChange={setLevel}
          options={[
            { value: 'all', label: 'Każdy poziom' },
            { value: 'critical', label: 'Krytyczne' },
            { value: 'warning', label: 'Ostrzeżenia' },
          ]}
        />
        {items.map((a) => (
          <AlertCard key={a.id} alert={a} />
        ))}
        {!items.length && <Notice>Brak alertów spełniających kryteria.</Notice>}
        {s.authenticated ? (
          <PrimaryButton title="Dodaj alert" icon="add" onPress={() => router.push('/alert-new')} />
        ) : (
          <Notice>Zaloguj się w zakładce Konto, aby dodawać i zamykać alerty.</Notice>
        )}
      </Guard>
    </Screen>
  );
}
