export const STORAGE_KEY = "memory-garden:v1:seeds";

const isBrowser = typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export function loadSeeds<T>(): T[] {
  if (!isBrowser) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch (error) {
    console.warn("Failed to load seeds from storage", error);
    return [];
  }
}

export function saveSeeds<T>(seeds: T[]): void {
  if (!isBrowser) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds));
  } catch (error) {
    console.warn("Failed to save seeds to storage", error);
  }
}

export function onSeedsStorageChange(cb: (seeds: unknown[]) => void): () => void {
  if (!isBrowser) {
    return () => {};
  }

  const handler = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) {
      return;
    }

    try {
      const nextValue = event.newValue ? JSON.parse(event.newValue) : [];
      cb(Array.isArray(nextValue) ? nextValue : []);
    } catch (error) {
      console.warn("Failed to parse seeds from storage event", error);
      cb([]);
    }
  };

  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

