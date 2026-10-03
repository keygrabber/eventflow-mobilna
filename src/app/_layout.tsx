import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WorkspaceProvider, useWorkspace } from '../state/Workspace';
import { Toast } from '../components/UI';
import { colors } from '../theme';

function Navigation() {
  const { ready } = useWorkspace();
  if (!ready) {
    return (
      <ActivityIndicator accessibilityLabel="Wczytywanie" color={colors.cyan} style={{ flex: 1 }} />
    );
  }
  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="event-editor" />
        <Stack.Screen name="zone-editor" />
        <Stack.Screen name="zone/[id]" />
        <Stack.Screen name="alert/[id]" />
        <Stack.Screen name="alert-new" />
        <Stack.Screen name="simulation" />
        <Stack.Screen name="reports" />
        <Stack.Screen name="settings" />
      </Stack>
      <Toast />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <WorkspaceProvider>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <StatusBar style="light" />
          <View style={{ flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center' }}>
            <Navigation />
          </View>
        </View>
      </WorkspaceProvider>
    </SafeAreaProvider>
  );
}
