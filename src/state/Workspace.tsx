import { AppState } from 'react-native';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { api, setToken } from '../domain/api';
import { fetchLive } from '../domain/live';
import {
  eventErrors,
  zoneErrors,
  type Profile,
  type Settings,
  type Event,
  type Zone,
  type AlertRecord,
  type Workspace,
} from '../domain/model';
const defaults: Settings = { warning: 70, critical: 90, showWarning: true, showCritical: true };
type Live = Awaited<ReturnType<typeof fetchLive>> & {
  loading: boolean;
  error: string;
  fetchedAt: string | null;
};
type ServerSettings = {
  profile: { name: string; email: string; organization: string };
  notifications: { critical: boolean; warning: boolean; sound: boolean; browser: boolean };
  thresholds: { warning: number; critical: number };
};
function useStore() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [live, setLive] = useState<Live>({
    events: [],
    alerts: [],
    selectedEventId: '',
    loading: true,
    error: '',
    fetchedAt: null,
  });
  const [selected, setSelected] = useState<string>();
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const [settings, setSettings] = useState(defaults);
  const serverSettings = useRef<ServerSettings | null>(null);
  const [settingsError, setSettingsError] = useState('');
  const [message, notify] = useState<string | null>(null);
  const generation = useRef(0);
  const load = useCallback(async (id = selectedRef.current) => {
    const revision = ++generation.current;
    setLive((p) => ({ ...p, loading: true }));
    try {
      const data = await fetchLive(id);
      if (revision === generation.current)
        setLive({ ...data, loading: false, error: '', fetchedAt: new Date().toISOString() });
    } catch (e) {
      if (revision === generation.current)
        setLive((p) => ({ ...p, loading: false, error: (e as Error).message }));
    }
  }, []);
  const loadSettings = useCallback(async () => {
    try {
      const data = await api<{ settings: ServerSettings }>('/settings');
      serverSettings.current = data.settings;
      setSettings({
        warning: data.settings.thresholds.warning,
        critical: data.settings.thresholds.critical,
        showWarning: data.settings.notifications.warning,
        showCritical: data.settings.notifications.critical,
      });
      setSettingsError('');
    } catch (e) {
      setSettingsError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    void load(selected);
  }, [load, selected]);
  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (AppState.currentState !== 'background') void load();
    }, 20000);
    const listener = AppState.addEventListener('change', (v) => {
      if (v === 'active') void load();
    });
    return () => {
      clearInterval(timer);
      listener.remove();
    };
  }, [load]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => notify(null), 6000);
    return () => clearTimeout(timer);
  }, [message]);
  async function login(email: string, password: string) {
    const result = await api<{ user: Profile; token: string }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (!['admin', 'organizer'].includes(result.user.role)) {
      setToken(result.token);
      await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
      setToken(null);
      throw new Error('Panel jest dostępny dla administratora i organizatora.');
    }
    setToken(result.token);
    setProfile({ ...result.user, organization: '' });
    setAuthenticated(true);
    await loadSettings().catch(() => undefined);
    await load();
  }
  async function logout() {
    try {
      if (authenticated) await api('/auth/logout', { method: 'POST' });
    } finally {
      generation.current++;
      setToken(null);
      setAuthenticated(false);
      setProfile(null);
      await load();
    }
  }
  async function write<T>(operation: () => Promise<T>): Promise<T> {
    if (!authenticated)
      throw new Error('Zaloguj się na konto organizatora lub administratora, aby zapisać zmiany.');
    if (locked.current) throw new Error('Poczekaj na zakończenie zapisu.');
    locked.current = true;
    setBusy(true);
    try {
      return await operation();
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function selectEvent(id: string) {
    if (!live.events.some((e) => e.id === id)) throw new Error('Nie znaleziono wydarzenia.');
    setSelected(id);
    await load(id);
  }
  async function saveEvent(id: string | undefined, values: Omit<Event, 'id' | 'zones'>) {
    const errors = eventErrors(values);
    if (errors.length) throw new Error(errors[0]);
    await write(async () => {
      const saved = await api<Event>(id ? `/events/${id}` : '/events', {
        method: id ? 'PUT' : 'POST',
        body: {
          ...values,
          start_at: new Date(values.start_at).toISOString(),
          end_at: new Date(values.end_at).toISOString(),
        },
      });
      setSelected(saved.id);
      await load(saved.id);
      notify('Zapisano wydarzenie w bazie.');
    });
  }
  const event = live.events.find((e) => e.id === live.selectedEventId);
  async function saveZone(id: string | undefined, values: Omit<Zone, 'id'>) {
    if (!event) throw new Error('Wybierz wydarzenie.');
    const errors = zoneErrors(
      values,
      event.zones.filter((z) => z.id !== id),
    );
    if (errors.length) throw new Error(errors[0]);
    await write(async () => {
      const { current_count: _, ...body } = values;
      await api(id ? `/zones/${id}` : `/events/${event.id}/zones`, {
        method: id ? 'PUT' : 'POST',
        body,
      });
      await load(event.id);
      notify('Zapisano strefę w bazie.');
    });
  }
  async function createAlert(zoneId: string, level: AlertRecord['level'], message: string) {
    if (!event?.zones.some((z) => z.id === zoneId)) throw new Error('Wybierz strefę.');
    await write(async () => {
      await api('/alerts', { method: 'POST', body: { zone_id: zoneId, level, message } });
      await load(event.id);
      notify('Dodano alert do bazy.');
    });
  }
  async function resolveAlert(id: string, _note: string) {
    await write(async () => {
      await api(`/alerts/${id}/resolve`, { method: 'POST' });
      await load();
      notify('Alert zamknięty w bazie.');
    });
  }
  async function toggleStep() {
    throw new Error('API nie zapisuje listy czynności.');
  }
  async function saveServerSettings(next: ServerSettings) {
    await write(async () => {
      await api('/settings', { method: 'PUT', body: next });
      await loadSettings();
      notify('Zapisano ustawienia w bazie.');
    });
  }
  async function saveSettings(value: Settings) {
    if (!serverSettings.current)
      throw new Error(settingsError || 'Ustawienia są jeszcze wczytywane.');
    await saveServerSettings({
      ...serverSettings.current,
      thresholds: { warning: value.warning, critical: value.critical },
      notifications: {
        ...serverSettings.current.notifications,
        warning: value.showWarning,
        critical: value.showCritical,
      },
    });
  }
  async function updateProfile(p: Profile) {
    if (!serverSettings.current)
      throw new Error(settingsError || 'Ustawienia są jeszcze wczytywane.');
    await saveServerSettings({
      ...serverSettings.current,
      profile: { name: p.name, email: p.email, organization: p.organization },
    });
    setProfile(p);
  }
  const workspace: Workspace = {
    version: 2,
    events: live.events,
    alerts: live.alerts,
    selectedEventId: live.selectedEventId,
    settings,
  };
  return {
    ready: true,
    busy,
    storageError: '',
    profile,
    authenticated,
    workspace,
    source: 'live' as const,
    events: live.events,
    event,
    alerts: live.alerts,
    live,
    message,
    notify,
    dismiss: () => notify(null),
    login,
    logout,
    updateProfile,
    settingsError,
    reload: load,
    refresh: () => void load(),
    selectEvent,
    saveEvent,
    saveZone,
    createAlert,
    toggleStep,
    resolveAlert,
    saveSettings,
  };
}
const Context = createContext<ReturnType<typeof useStore> | null>(null);
export function WorkspaceProvider({ children }: PropsWithChildren) {
  return <Context.Provider value={useStore()}>{children}</Context.Provider>;
}
export function useWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error('WorkspaceProvider is missing');
  return value;
}
