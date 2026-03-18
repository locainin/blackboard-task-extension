// Guard extension API calls after a reload
// Old content scripts can stay on the page for a moment and should fail closed

declare global {
  interface Window {
    __tfcExtensionContextHandlersInstalled?: boolean;
  }
}

export function hasExtensionContext() {
  try {
    // `chrome.runtime.id` disappears as soon as the old extension context dies
    // This is the cheapest check before touching any extension APIs
    return typeof chrome !== 'undefined' && Boolean(chrome.runtime?.id);
  } catch (_error) {
    return false;
  }
}

export function isExtensionContextInvalidated(error: unknown) {
  if (typeof error === 'string') {
    return error.includes('Extension context invalidated');
  }

  if (error instanceof Error) {
    return error.message.includes('Extension context invalidated');
  }

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message.includes('Extension context invalidated');
  }

  return false;
}

export async function safeStorageSyncGet<Type>(
  keys: string | string[],
  fallback: Type
): Promise<Type> {
  // Return the fallback instead of throwing when the page is still running
  // an old content script after the extension was reloaded
  if (!hasExtensionContext()) return fallback;

  try {
    return (await chrome.storage.sync.get(keys)) as Type;
  } catch (error) {
    if (isExtensionContextInvalidated(error)) return fallback;
    throw error;
  }
}

export async function safeStorageSyncSet(
  values: Record<string, unknown>
): Promise<void> {
  // Writes from stale scripts are safe to drop
  // The fresh script will hydrate state again after the next page load
  if (!hasExtensionContext()) return;

  try {
    await chrome.storage.sync.set(values);
  } catch (error) {
    if (isExtensionContextInvalidated(error)) return;
    throw error;
  }
}

export async function safeStorageLocalGet<Type>(
  keys: string | string[],
  fallback: Type
): Promise<Type> {
  // Local storage calls fail the same way as sync storage after a reload
  if (!hasExtensionContext()) return fallback;

  try {
    return (await chrome.storage.local.get(keys)) as Type;
  } catch (error) {
    if (isExtensionContextInvalidated(error)) return fallback;
    throw error;
  }
}

export async function safeStorageLocalSet(
  values: Record<string, unknown>
): Promise<void> {
  // Local cache writes are best-effort only
  if (!hasExtensionContext()) return;

  try {
    await chrome.storage.local.set(values);
  } catch (error) {
    if (isExtensionContextInvalidated(error)) return;
    throw error;
  }
}

export function safeAddStorageOnChangedListener(
  listener: (changes: { [key: string]: chrome.storage.StorageChange }) => void
) {
  // Listener registration can fail during the tiny reload window
  // Returning false keeps cleanup code simple for callers
  if (!hasExtensionContext()) return false;

  try {
    chrome.storage.onChanged.addListener(listener);
    return true;
  } catch (error) {
    if (isExtensionContextInvalidated(error)) return false;
    throw error;
  }
}

export function safeRemoveStorageOnChangedListener(
  listener: (changes: { [key: string]: chrome.storage.StorageChange }) => void
) {
  // Cleanup should never surface the stale-context case as a real error
  if (!hasExtensionContext()) return;

  try {
    chrome.storage.onChanged.removeListener(listener);
  } catch (error) {
    if (isExtensionContextInvalidated(error)) return;
    throw error;
  }
}

export function safeRuntimeGetURL(path: string, fallback = '#') {
  // Links like the options page should degrade instead of crashing the panel
  if (!hasExtensionContext()) return fallback;

  try {
    return chrome.runtime.getURL(path);
  } catch (error) {
    if (isExtensionContextInvalidated(error)) return fallback;
    throw error;
  }
}

export function swallowExtensionContextInvalidated(error: unknown) {
  // Only swallow the known extension reload case
  // Everything else should still fail loudly during development
  if (isExtensionContextInvalidated(error)) {
    return;
  }
  throw error;
}

export function installExtensionContextInvalidatedHandler() {
  // Install the global filters once
  // Blackboard navigation can mount the content script more than once in dev
  if (window.__tfcExtensionContextHandlersInstalled) return;
  window.__tfcExtensionContextHandlersInstalled = true;

  // Old content scripts can stay alive until the page reloads
  // Ignore only the known reload-time rejection so real errors still surface
  window.addEventListener('unhandledrejection', (event) => {
    if (!isExtensionContextInvalidated(event.reason)) return;
    event.preventDefault();
  });

  // Some browsers surface the same dead-context case as a normal window error
  // Filtering it here keeps the extension error pane focused on real issues
  window.addEventListener('error', (event) => {
    if (!isExtensionContextInvalidated(event.error || event.message)) return;
    event.preventDefault();
  });
}
