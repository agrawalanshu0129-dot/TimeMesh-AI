/**
 * storageService.ts
 *
 * Central helper layer for reading from and writing to browser
 * localStorage. Provides:
 *   - Type-safe load / save helpers with try/catch and fallback logic
 *   - A quota-exceeded guard that warns rather than throws
 *   - A `clearAllData()` utility that removes every TimeMesh-AI key
 *   - A `getAllKeys()` helper to enumerate stored keys
 */

/** All localStorage keys used by TimeMesh AI. */
export const STORAGE_KEYS = {
  CURRENT_MEMBER: 'timemesh_current_member',
  MEMBERS: 'timemesh_members',
  EVENTS: 'timemesh_events',
  CONFLICTS: 'timemesh_conflicts',
  CHAT: 'timemesh_chat',
  SETTINGS: 'timemesh_settings',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

/**
 * Read and JSON-parse a value from localStorage.
 * Returns `fallback` when the key does not exist or the value is invalid JSON.
 */
export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    console.warn(`[storageService] Failed to parse "${key}" from localStorage – using fallback.`);
    return fallback;
  }
}

/**
 * JSON-serialize `value` and write it to localStorage under `key`.
 * Gracefully handles QuotaExceededError by logging a warning instead
 * of propagating the error to the caller.
 */
export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      console.warn(
        `[storageService] localStorage quota exceeded while writing "${key}". ` +
          'Some data may not be persisted.',
      );
    } else {
      console.warn(`[storageService] Failed to write "${key}" to localStorage:`, err);
    }
  }
}

/**
 * Remove a single key from localStorage.
 */
export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[storageService] Failed to remove "${key}" from localStorage:`, err);
  }
}

// ---------------------------------------------------------------------------
// Bulk helpers
// ---------------------------------------------------------------------------

/**
 * Return all TimeMesh AI localStorage keys that are currently set.
 */
export function getAllKeys(): StorageKey[] {
  return Object.values(STORAGE_KEYS).filter(
    key => localStorage.getItem(key) !== null,
  ) as StorageKey[];
}

/**
 * Remove **all** TimeMesh AI keys from localStorage, effectively
 * resetting the app to its default mock-data state on the next load.
 */
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => removeFromStorage(key));
}

/**
 * Estimate the total number of bytes used by TimeMesh AI keys
 * (rough approximation – UTF-16 string length × 2).
 */
export function estimateStorageUsage(): number {
  return Object.values(STORAGE_KEYS).reduce((total, key) => {
    const value = localStorage.getItem(key);
    return total + (value ? value.length * 2 : 0);
  }, 0);
}
