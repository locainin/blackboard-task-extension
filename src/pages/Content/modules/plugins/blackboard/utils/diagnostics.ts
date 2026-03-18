import {
  safeAddStorageOnChangedListener,
  safeStorageSyncGet,
} from '../../../utils/extensionContext';

const DIAGNOSTICS_OPTION_KEY = 'blackboard_diagnostics';
const DIAGNOSTICS_CACHE_MS = 30 * 1000;

let cachedEnabled = false;
let cachedAt = 0;
let pendingRead: Promise<boolean> | null = null;
let listenerInstalled = false;

function now() {
  return Date.now();
}

function ensureDiagnosticsListener() {
  // Keep the cache in sync with the settings page
  // Diagnostics should respond right away without waiting for the ttl to expire
  if (listenerInstalled) return;

  const installed = safeAddStorageOnChangedListener((changes) => {
    if (!(DIAGNOSTICS_OPTION_KEY in changes)) return;
    cachedEnabled = changes[DIAGNOSTICS_OPTION_KEY].newValue === true;
    cachedAt = now();
  });

  if (installed) {
    listenerInstalled = true;
  }
}

async function readDiagnosticsEnabled() {
  const result = await safeStorageSyncGet<Record<string, unknown>>(
    [DIAGNOSTICS_OPTION_KEY],
    {}
  );
  return result[DIAGNOSTICS_OPTION_KEY] === true;
}

export async function isBlackboardDiagnosticsEnabled() {
  ensureDiagnosticsListener();

  // Keep the storage hit cheap
  // Blackboard loaders can fire many requests in one render cycle
  if (cachedAt && now() - cachedAt < DIAGNOSTICS_CACHE_MS) {
    return cachedEnabled;
  }

  if (pendingRead) {
    return pendingRead;
  }

  pendingRead = readDiagnosticsEnabled()
    .then((enabled) => {
      cachedEnabled = enabled;
      cachedAt = now();
      return enabled;
    })
    .finally(() => {
      pendingRead = null;
    });

  return pendingRead;
}

export function resetBlackboardDiagnosticsCache() {
  // Let the next read hit storage again
  // This is useful for tests and manual diagnostics work
  cachedAt = 0;
}

export function logBlackboardDiagnostics(
  event: string,
  details?: Record<string, unknown>
) {
  // Keep diagnostics fully silent unless the setting is enabled
  void isBlackboardDiagnosticsEnabled().then((enabled) => {
    if (!enabled) return;

    const prefix = `[Tasks for Blackboard][Diagnostics] ${event}`;
    if (!details || Object.keys(details).length === 0) {
      console.log(prefix);
      return;
    }

    console.groupCollapsed(prefix);
    Object.entries(details).forEach(([key, value]) => {
      console.log(`${key}:`, value);
    });
    console.groupEnd();
  });
}
