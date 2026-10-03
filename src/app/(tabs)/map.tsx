import { useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { Screen, Section, PrimaryButton } from '../../components/UI';
import {
  Choices,
  ContextBar,
  Field,
  FloorPlan,
  Guard,
  Notice,
  ZoneCard,
} from '../../components/Organizer';
import { useWorkspace } from '../../state/Workspace';
import { zoneStatus } from '../../domain/model';
import { ui } from '../../theme';
export default function Map() {
  const s = useWorkspace();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const zones = (s.event?.zones ?? []).filter(
    (z) =>
      z.name.toLocaleLowerCase('pl').includes(query.toLocaleLowerCase('pl')) &&
      (filter === 'all' || zoneStatus(z, s.workspace.settings.warning).level === filter),
  );
  return (
    <Screen title="Mapa i strefy" subtitle="Sprawdź obciążenie i reaguj na zmiany.">
      <ContextBar />
      <Guard>
        {s.event?.zones.some((z) => z.area) ? (
          <>
            <FloorPlan zones={s.event?.zones ?? []} />
            <Text style={ui.muted}>
              Schemat terenu · dotknij strefy. Małe pola oznaczono numerami z listy poniżej.
            </Text>
          </>
        ) : (
          <Notice>
            To wydarzenie nie ma jeszcze obszarów stref na planie. Możesz dodać je w edycji stref.
          </Notice>
        )}
        <Section number="01" title="Monitorowane strefy" />
        <Field label="Szukaj strefy" value={query} onChangeText={setQuery} />
        <Choices
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Wszystkie' },
            { value: 'safe', label: 'Bezpieczne' },
            { value: 'warning', label: 'Uwaga' },
            { value: 'critical', label: 'Krytyczne' },
          ]}
        />
        {zones.map((z) => (
          <ZoneCard key={z.id} zone={z} />
        ))}
        {!zones.length && <Notice>Brak stref spełniających te kryteria.</Notice>}
        {s.authenticated && (
          <PrimaryButton
            title="Dodaj strefę"
            icon="add"
            onPress={() => router.push('/zone-editor')}
          />
        )}
      </Guard>
    </Screen>
  );
}
