import { useContext, useEffect } from 'react';
import { OptionsDefaults } from '../constants';
import { Options } from '../types';
import isDarkMode from '../utils/isDarkMode';
import { useConfigStore } from './useStore';
import { OptionsContext } from '../contexts/contexts';
import {
  safeAddStorageOnChangedListener,
  safeRemoveStorageOnChangedListener,
  safeStorageSyncGet,
  safeStorageSyncSet,
} from '../utils/extensionContext';

const storedUserOptions = Object.keys(OptionsDefaults);

function applyDefaults(options: Options): Options {
  const opts = {
    ...OptionsDefaults,
    ...options,
  };

  // Keep the sidebar dark-mode default tied to the real environment
  // only when the user has never stored a preference yet
  if (typeof options.dark_mode !== 'boolean') {
    opts.dark_mode = isDarkMode();
  }
  return opts;
}

function getChangedDefaultValues(
  storedOptions: Options,
  resolvedOptions: Options
): Partial<Options> {
  const changedDefaults: Record<string, unknown> = {};

  // Only write keys that are missing or stale
  // This avoids a sync storage write on every page load
  storedUserOptions.forEach((key) => {
    const typedKey = key as keyof Options;
    if (storedOptions[typedKey] !== resolvedOptions[typedKey]) {
      changedDefaults[typedKey] = resolvedOptions[typedKey];
    }
  });

  return changedDefaults as Partial<Options>;
}

export async function getOptions(): Promise<Options> {
  // Fall back to resolved defaults if the old content script survives an extension reload
  const storedOptions = await safeStorageSyncGet<Options>(
    storedUserOptions,
    {} as Options
  );
  const resolvedOptions = applyDefaults(storedOptions);
  const changedDefaults = getChangedDefaultValues(
    storedOptions,
    resolvedOptions
  );

  // Skip the extra storage write when everything is already present
  if (Object.keys(changedDefaults).length === 0) {
    return resolvedOptions;
  }

  await safeStorageSyncSet(changedDefaults as Record<string, unknown>);
  return resolvedOptions;
}

export interface OptionsInterface {
  state: Options;
  update: (key: string, value: unknown) => Options;
}

export function useOptionsStore(
  arg?: Options,
  onUpdateCallback?: () => void
): OptionsInterface {
  const { state, update } = useConfigStore<Options>(
    arg || OptionsDefaults,
    true
  );

  function updateKey(key: string, value: unknown) {
    return update([key], value, true);
  }

  useEffect(() => {
    let active = true;

    // Keep the live options store in sync with changes from the options page
    const storageListener = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      if (!active) return;

      for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
        if (storedUserOptions.includes(key) && oldValue !== newValue) {
          update([key], newValue, false);
          if (onUpdateCallback) onUpdateCallback();
        }
      }
    };

    safeAddStorageOnChangedListener(storageListener);
    return () => {
      active = false;
      safeRemoveStorageOnChangedListener(storageListener);
    };
  }, [onUpdateCallback, update]);

  return { state, update: updateKey };
}

// Use cached options from context
export default function useOptions(): OptionsInterface {
  return useContext(OptionsContext);
}
