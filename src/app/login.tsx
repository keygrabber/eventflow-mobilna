import { useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Screen, PrimaryButton, Action, Icon } from '../components/UI';
import { Field, ErrorText, Notice } from '../components/Organizer';
import { useWorkspace } from '../state/Workspace';
import { colors, ui } from '../theme';

export default function Login() {
  const s = useWorkspace();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function enter() {
    setBusy(true);
    setError('');
    try {
      await s.login(email, password);
      setPassword('');
      router.replace('/(tabs)');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function fillCreds(u: string, p: string) {
    setEmail(u);
    setPassword(p);
    setError('');
  }

  return (
    <Screen title="Twój event. Pod kontrolą." subtitle="Zaloguj się na konto w EventFlow.">
      <View style={[ui.card, { alignItems: 'center', padding: 24, gap: 10, marginBottom: 16 }]}>
        <Icon name="pulse-outline" size={44} color={colors.cyan} />
        <Text style={ui.title}>Witaj w EventFlow</Text>
        <Text style={[ui.small, { textAlign: 'center' }]}>
          Zaloguj się, aby zarządzać strefami, alertami i symulacją.
        </Text>
      </View>

      <Field
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoComplete="email"
      />
      <Field
        label="Hasło"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
      />

      <Notice>
        Szybkie logowanie testowe:
      </Notice>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <Pressable
          onPress={() => fillCreds('klysiudev@zohomail.eu', 'makapaka')}
          style={{
            backgroundColor: colors.card,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: colors.cyan, fontSize: 13, fontWeight: '600' }}>
            Organizator (klysiudev)
          </Text>
        </Pressable>
        <Pressable
          onPress={() => fillCreds('admin@eventflow.pl', 'password123')}
          style={{
            backgroundColor: colors.card,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: colors.amber, fontSize: 13, fontWeight: '600' }}>
            Administrator (admin)
          </Text>
        </Pressable>
      </View>

      <ErrorText value={error} />

      <View style={{ gap: 10, marginTop: 8 }}>
        <PrimaryButton
          title={busy ? 'Logowanie…' : 'Zaloguj się'}
          icon="log-in-outline"
          disabled={busy || !email || !password}
          onPress={() => void enter()}
        />
        <Action
          label="Wróć do podglądu"
          onPress={() => router.replace('/(tabs)')}
          style={[ui.card, ui.row, { justifyContent: 'center' }]}
        >
          <Icon name="arrow-back-outline" />
          <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>
            Wróć do podglądu
          </Text>
        </Action>
      </View>
    </Screen>
  );
}
