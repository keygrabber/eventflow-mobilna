// Safely resolve platform & constants in React Native and Node.js test runners
let PlatformOS = 'unknown';
let ConstantsObj: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const rn = require('react-native');
  PlatformOS = rn.Platform?.OS ?? 'unknown';
} catch {
  // Pure Node environment
}
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const expConst = require('expo-constants');
  ConstantsObj = expConst.default ?? expConst;
} catch {
  // Pure Node environment
}

function getMetroHost(): string {
  if (!ConstantsObj) return '';
  const c = ConstantsObj as Record<string, unknown>;
  const expoCfg = ConstantsObj.expoConfig as { hostUri?: string } | undefined;
  const expoGoCfg = c.expoGoConfig as { debuggerHost?: string } | undefined;
  const manifest2 = c.manifest2 as { extra?: { expoGo?: { debuggerHost?: string } } } | undefined;
  const manifest = c.manifest as { debuggerHost?: string } | undefined;

  const candidate =
    expoCfg?.hostUri ??
    expoGoCfg?.debuggerHost ??
    manifest2?.extra?.expoGo?.debuggerHost ??
    manifest?.debuggerHost ??
    '';

  return String(candidate || '').trim();
}

export function developmentUrl(): string {
  if (PlatformOS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/eventflow-api`;
  }
  const metroHost = getMetroHost();
  if (!metroHost) return '';

  const address = metroHost.replace(/^\w+:\/\//, '').replace(/\/$/, '');
  const protocol = /\.(exp\.direct|ngrok[^/:]*)(?:[:/]|$)/i.test(address) ? 'https' : 'http';
  return `${protocol}://${address}/eventflow-api`;
}

export function getApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }
  const dev = developmentUrl();
  if (dev) return dev.replace(/\/$/, '');
  return 'http://127.0.0.1:8000/api/v1';
}

export const API_URL = getApiUrl();

let token: string | null = null;
export const setToken = (value: string | null) => {
  token = value;
};

export async function api<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal; text?: boolean } = {},
): Promise<T> {
  const baseUrl = getApiUrl() || API_URL;
  if (!baseUrl) {
    throw new Error(
      'Brak adresu backendu. Uruchom Expo z flagą --tunnel lub ustaw EXPO_PUBLIC_API_URL.',
    );
  }
  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.addEventListener('abort', abort);
  if (options.signal?.aborted) controller.abort();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    abort();
  }, 30000);
  try {
    const formattedPath = path.startsWith('/') ? path : `/${path}`;
    const response = await fetch(`${baseUrl}${formattedPath}`, {
      method: options.method ?? 'GET',
      signal: controller.signal,
      headers: {
        Accept: options.text ? 'text/csv' : 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const validation = payload.errors ? Object.values(payload.errors).flat().join('\n') : '';
      throw new Error(validation || payload.message || `API: HTTP ${response.status}`);
    }
    return (options.text ? await response.text() : await response.json()) as T;
  } catch (error) {
    if (timedOut)
      throw new Error(
        'Serwer nie odpowiedział w ciągu 30 sekund. Sprawdź, czy backend i Expo są uruchomione.',
      );
    if (options.signal?.aborted) throw error;
    if (
      controller.signal.aborted ||
      (error instanceof Error && /cancel|abort/i.test(error.message))
    )
      throw new Error('Połączenie z serwerem zostało przerwane. Spróbuj ponownie.');
    if (error instanceof TypeError)
      throw new Error(
        `Nie można połączyć z ${baseUrl}. Sprawdź adres i dostęp telefonu do serwera.`,
      );
    throw error;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abort);
  }
}
