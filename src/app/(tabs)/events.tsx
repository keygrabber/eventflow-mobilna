import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Action, Badge, PrimaryButton } from '../../components/UI';
import { Choices, ContextBar, Field, Notice } from '../../components/Organizer';
import { useWorkspace } from '../../state/Workspace';
import { number, statuses } from '../../domain/model';
import { ui } from '../../theme';
export default function Events() {
  const s = useWorkspace();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const events = s.events.filter(
    (e) =>
      `${e.name} ${e.venue}`.toLowerCase().includes(query.toLowerCase()) &&
      (filter === 'all' || e.status === filter),
  );
  return (
    <Screen title="Twoje wydarzenia" subtitle="Zarządzaj wydarzeniami i ich strefami.">
      <ContextBar />
      <Field label="Szukaj wydarzenia" value={query} onChangeText={setQuery} />
      <Choices
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'Wszystkie' },
          ...Object.entries(statuses).map(([value, label]) => ({ value, label })),
        ]}
      />
      {events.map((e) => (
        <View key={e.id} style={[ui.card, { gap: 10, marginBottom: 14 }]}>
          <Badge>{statuses[e.status]}</Badge>
          <Text style={ui.title}>{e.name}</Text>
          <Text style={ui.small}>{e.venue}</Text>
          <Text style={ui.muted}>
            {new Date(e.start_at).toLocaleString('pl-PL', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </Text>
          <Text style={ui.small}>
            {e.zones.length} stref · limit {number(e.max_capacity)} osób
          </Text>
          <Action
            label={`Otwórz: ${e.name}`}
            disabled={s.busy}
            onPress={() =>
              void s
                .selectEvent(e.id)
                .then(() => router.navigate('/'))
                .catch((e) => s.notify(e.message))
            }
          >
            <Text style={ui.cyan}>
              {e.id === s.event?.id ? 'Otwórz bieżące wydarzenie' : 'Otwórz wydarzenie'} →
            </Text>
          </Action>
          {s.authenticated && (
            <Action
              label={`Edytuj: ${e.name}`}
              onPress={() => router.push({ pathname: '/event-editor', params: { id: e.id } })}
            >
              <Text style={ui.small}>Edytuj wydarzenie</Text>
            </Action>
          )}
        </View>
      ))}
      {!events.length && <Notice>Brak wydarzeń pasujących do wyszukiwania.</Notice>}
      {s.authenticated && (
        <PrimaryButton
          title="Dodaj wydarzenie"
          icon="add"
          onPress={() => router.push('/event-editor')}
        />
      )}
    </Screen>
  );
}
