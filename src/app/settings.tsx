import { useState } from 'react';
import { View, Text, Switch } from 'react-native';
import { Screen, Section, PrimaryButton } from '../components/UI';
import { Field, ErrorText, Notice } from '../components/Organizer';
import { useWorkspace } from '../state/Workspace';
import { colors, ui } from '../theme';
export default function Settings() {
  const s = useWorkspace();
  const [name, setName] = useState(s.profile!.name);
  const [organization, setOrganization] = useState(s.profile!.organization);
  const [warning, setWarning] = useState(String(s.workspace.settings.warning));
  const [critical, setCritical] = useState(String(s.workspace.settings.critical));
  const [showWarning, setShowWarning] = useState(s.workspace.settings.showWarning);
  const [showCritical, setShowCritical] = useState(s.workspace.settings.showCritical);
  const [error, setError] = useState('');
  async function saveProfile() {
    setError('');
    try {
      await s.updateProfile({ ...s.profile!, name, organization });
      s.notify('Zapisano profil.');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function save() {
    setError('');
    try {
      await s.saveSettings({
        warning: Number(warning),
        critical: Number(critical),
        showWarning,
        showCritical,
      });
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Screen back title="Ustawienia" subtitle="Preferencje Twojego panelu.">
      <Section number="01" title="Profil w ustawieniach" />
      <Field label="Imię i nazwisko" value={name} onChangeText={setName} maxLength={80} />
      <Field
        label="Organizacja"
        value={organization}
        onChangeText={setOrganization}
        maxLength={120}
      />
      <PrimaryButton
        title="Zapisz profil"
        icon="person-outline"
        onPress={() => void saveProfile()}
      />
      <Section number="02" title="Progi i widoczność" />
      {s.authenticated ? (
        <>
          <Field
            label="Próg ostrzegania (%)"
            value={warning}
            onChangeText={setWarning}
            keyboardType="number-pad"
          />
          <Field
            label="Domyślny próg krytyczny nowych stref (%)"
            value={critical}
            onChangeText={setCritical}
            keyboardType="number-pad"
          />
          <Notice>
            Istniejące strefy zachowują własny próg krytyczny. Zmienisz go w edycji strefy. Progi
            wpływają na oznaczenia w panelu, nie generują alertów automatycznie.
          </Notice>
          {[
            { label: 'Ostrzeżenia na przeglądzie', value: showWarning, set: setShowWarning },
            { label: 'Alerty krytyczne na przeglądzie', value: showCritical, set: setShowCritical },
          ].map((item) => (
            <View key={item.label} style={[ui.card, ui.between, { marginBottom: 10 }]}>
              <Text style={[ui.small, ui.grow]}>{item.label}</Text>
              <Switch
                accessibilityLabel={item.label}
                value={item.value}
                onValueChange={item.set}
                trackColor={{ true: colors.cyan, false: colors.border }}
              />
            </View>
          ))}
          <Text style={[ui.muted, { marginBottom: 14 }]}>
            Pełna lista i licznik aktywnych alertów pozostają dostępne w zakładce Alerty. Te
            ustawienia nie włączają powiadomień push.
          </Text>
          <PrimaryButton
            title="Zapisz ustawienia"
            icon="checkmark"
            disabled={s.busy}
            onPress={() => void save()}
          />
        </>
      ) : (
        <Notice>Zaloguj się, aby zmieniać ustawienia w bazie.</Notice>
      )}
      <ErrorText value={error || s.settingsError} />
    </Screen>
  );
}
