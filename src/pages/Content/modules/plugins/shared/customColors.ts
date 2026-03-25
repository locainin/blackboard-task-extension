import { DEFAULT_DASHBOARD_COLORS } from '../../constants';
import {
  safeAddStorageOnChangedListener,
  safeStorageSyncGet,
  safeStorageSyncSet,
} from '../../utils/extensionContext';

export type StoredCustomColors = Record<string, string>;

function colorsKey(platformKey: string) {
  return `${platformKey}_colors`;
}

export function colorFromId(id: string | number) {
  if (typeof id === 'number')
    return DEFAULT_DASHBOARD_COLORS[id % DEFAULT_DASHBOARD_COLORS.length];
  let hash = 0;
  for (let i = 0, len = id.length; i < len; i++) {
    hash = hash + id.charCodeAt(i);
    hash |= 0;
  }
  return DEFAULT_DASHBOARD_COLORS[hash % DEFAULT_DASHBOARD_COLORS.length];
}

export async function loadCustomColors(
  platformKey: string
): Promise<StoredCustomColors> {
  const key = colorsKey(platformKey);
  const colors = await safeStorageSyncGet<Record<string, unknown>>(key, {});
  if (!(key in colors)) return {};
  return colors[key] as StoredCustomColors;
}

export async function setCustomColors(
  platformKey: string,
  customColors: StoredCustomColors
) {
  const colors = await loadCustomColors(platformKey);
  const key = colorsKey(platformKey);
  // Ignore writes from stale content scripts after an extension reload
  await safeStorageSyncSet({
    [key]: {
      ...colors,
      ...customColors,
    },
  });
}

// does not actually set the defaults in storage
export async function loadCustomColorsWithDefaults(
  platformKey: string,
  courses: string[]
): Promise<StoredCustomColors> {
  const currColors = await loadCustomColors(platformKey);
  const defaultColors = courses.reduce((colors: StoredCustomColors, cid) => {
    colors[cid] = colorFromId(cid);
    return colors;
  }, {});
  const res = {
    ...defaultColors,
    ...currColors,
  };
  return res;
}

export function watchCustomColors(
  platformKey: string,
  callback: (id: string, color: string) => void
) {
  const key = colorsKey(platformKey);
  const listener = (changes: {
    [key: string]: chrome.storage.StorageChange;
  }) => {
    if (key in changes) {
      const previousColors = (changes[key].oldValue ?? {}) as Record<
        string,
        unknown
      >;
      const nextColors = (changes[key].newValue ?? {}) as Record<
        string,
        unknown
      >;
      const affectedCourseIds = new Set([
        ...Object.keys(previousColors),
        ...Object.keys(nextColors),
      ]);

      affectedCourseIds.forEach((courseId) => {
        const previousColor = previousColors[courseId];
        const nextColor = nextColors[courseId];

        // Ignore entries that did not really change
        // This keeps listeners from repainting on no-op storage writes
        if (previousColor === nextColor) return;

        // Deleted custom colors should snap back to the deterministic default
        // That keeps the UI in sync without waiting for a full course reload
        if (typeof nextColor !== 'string') {
          callback(courseId, colorFromId(courseId));
          return;
        }

        callback(courseId, nextColor);
      });
    }
  };
  safeAddStorageOnChangedListener(listener);
  return listener;
}
