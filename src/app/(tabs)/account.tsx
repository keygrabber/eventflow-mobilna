import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Section, Action, Icon, Badge, PrimaryButton } from '../../components/UI';
import { Notice } from '../../components/Organizer';
import { useWorkspace } from '../../state/Workspace';
import { roles } from '../../domain/model';
import { API_URL } from '../../domain/live';
import { ui } from '../../theme';
export default function Account() {
  const s = useWorkspace();
  const p = s.profile ?? {
    name: 'Podgląd wydarzenia',
    email: 'Tryb podglądu (tylko odczyt)',
    organization: '',
    role: 'organizer' as const,
  };
  return (
    <Screen title="Twoje konto" subtitle="Dane i narzędzia organizatora.">
      <View style={[ui.card, { gap: 12, alignItems: 'center', padding: 24 }]}>
        <Icon name="person-outline" size={32} />
        <Text style={ui.title}>{p.name}</Text>
        <Badge>{s.authenticated ? roles[p.role] : 'PODGLĄD BAZY'}</Badge>
        {!!p.email && <Text style={ui.small}>{p.email}</Text>}
      </View>
      <Section number="01" title="Połączenie z bazą" />
      <Notice>
        Wydarzenia, strefy i alerty z serwera. Odświeżanie co 20 sekund.{'\n'}
        {API_URL}
      </Notice>
      <Action label="Odśwież dane" onPress={s.refresh}>
        <Text style={ui.cyan}>Odśwież dane</Text>
      </Action>
      <Section number="02" title="Narzędzia" />
      {(
        [
          { title: 'Symulacja przepływu', path: '/simulation', icon: 'git-network-outline' },
          { title: 'Raporty i eksport CSV', path: '/reports', icon: 'bar-chart-outline' },
          { title: 'Ustawienia', path: '/settings', icon: 'settings-outline' },
        ] as const
      ).map((a) => (
        <Action
          key={a.path}
          label={a.title}
          onPress={() => router.push(a.path)}
          style={[ui.card, ui.row, { marginBottom: 10 }]}
        >
          <Icon name={a.icon} />
          <Text style={[ui.text, ui.grow]}>{a.title}</Text>
          <Icon name="chevron-forward" />
        </Action>
      ))}
      <Section number="03" title="Sesja" />
      <PrimaryButton
        title={s.authenticated ? 'Wyloguj się' : 'Zaloguj się do konta'}
        icon="log-in-outline"
        onPress={() => {
          if (s.authenticated) {
            void s.logout().catch((e) => s.notify(e.message));
          } else {
            router.push('/login');
          }
        }}
      />
    </Screen>
  );
}
