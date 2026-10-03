import { useState } from 'react';
import { View, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen, PrimaryButton, Section } from '../components/UI';
import { ErrorText, Field, FloorPlan, Guard, Notice } from '../components/Organizer';
import { useWorkspace } from '../state/Workspace';
import { type Area } from '../domain/model';
import { ui } from '../theme';
export default function ZoneEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const s = useWorkspace();
  const old = s.event?.zones.find((z) => z.id === id);
  const [name, setName] = useState(old?.name ?? '');
  const [capacity, setCapacity] = useState(String(old?.capacity ?? 1000));
  const [threshold, setThreshold] = useState(
    String(old?.alert_threshold ?? s.workspace.settings.critical),
  );
  const [area, setArea] = useState({
    x: String(old?.area?.x ?? 0),
    y: String(old?.area?.y ?? 0),
    width: String(old?.area?.width ?? 20),
    height: String(old?.area?.height ?? 20),
  });
  const [error, setError] = useState('');
  const numeric = Object.fromEntries(
    Object.entries(area).map(([k, v]) => [k, Number(v)]),
  ) as unknown as Area;
  const preview = {
    id: 'preview',
    name: name || 'Nowa strefa',
    capacity: Number(capacity) || 1,
    alert_threshold: Number(threshold),
    current_count: old?.current_count ?? 0,
    area: numeric,
  };
  async function save() {
    setError('');
    try {
      await s.saveZone(id, { ...preview, name });
      router.replace('/map');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Screen
      back
      title={id ? 'Edytuj strefę' : 'Nowa strefa'}
      subtitle={s.event?.name ?? 'Wybierz wydarzenie'}
    >
      <Guard edit>
        {id && !old ? (
          <Notice>Nie znaleziono strefy.</Notice>
        ) : (
          <>
            <Field label="Nazwa strefy" value={name} onChangeText={setName} maxLength={100} />
            <Field
              label="Pojemność strefy"
              value={capacity}
              onChangeText={setCapacity}
              keyboardType="number-pad"
            />
            <Field
              label="Próg krytyczny (%)"
              value={threshold}
              onChangeText={setThreshold}
              keyboardType="number-pad"
            />
            <Section number="01" title="Obszar na planie" />
            <Text style={[ui.small, { marginBottom: 14 }]}>
              Pozycja i rozmiar w procentach planu. Obszary nie mogą na siebie nachodzić.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {(
                [
                  { key: 'x', label: 'Pozycja X (%)' },
                  { key: 'y', label: 'Pozycja Y (%)' },
                  { key: 'width', label: 'Szerokość (%)' },
                  { key: 'height', label: 'Wysokość (%)' },
                ] as const
              ).map((f) => (
                <View key={f.key} style={{ width: '47%' }}>
                  <Field
                    label={f.label}
                    value={area[f.key]}
                    onChangeText={(v) => setArea({ ...area, [f.key]: v })}
                    keyboardType="number-pad"
                  />
                </View>
              ))}
            </View>
            {Object.values(numeric).every((v) => Number.isFinite(v) && v >= 0 && v <= 100) &&
              numeric.x + numeric.width <= 100 &&
              numeric.y + numeric.height <= 100 && (
                <FloorPlan
                  interactive={false}
                  zones={[...(s.event?.zones.filter((z) => z.id !== id) ?? []), preview]}
                />
              )}
            <Notice>Liczba osób pochodzi z pomiarów. Edycja strefy jej nie zmienia.</Notice>
            <ErrorText value={error} />
            <PrimaryButton
              title="Zapisz strefę"
              icon="checkmark"
              disabled={s.busy || !!s.storageError}
              onPress={() => void save()}
            />
          </>
        )}
      </Guard>
    </Screen>
  );
}
