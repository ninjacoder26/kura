'use client';

// SWR-style in-memory page cache: every feed renders INSTANTLY from cache
// on mount/navigation and revalidates in the background. Backend latency
// becomes invisible — no skeleton flash, no "switching webpages" feel.
// Entries are capped; correctness comes from always revalidating on mount.

interface CacheEntry {
  at: number;
  value: any;
}

const store = new Map<string, CacheEntry>();
const MAX_ENTRIES = 40;

export function getPageCache<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  // Refresh recency (cheap LRU)
  store.delete(key);
  store.set(key, entry);
  return entry.value as T;
}

export function hasPageCache(key: string): boolean {
  return store.has(key);
}

/** Feeds younger than this skip their background refetch on revisit. */
export const FEED_STALE_MS = 30_000;

/** True when cached data exists and is younger than maxAgeMs. */
export function isCacheFresh(key: string, maxAgeMs: number = FEED_STALE_MS): boolean {
  const entry = store.get(key);
  return !!entry && Date.now() - entry.at < maxAgeMs;
}

export function setPageCache(key: string, value: any): void {
  if (store.has(key)) store.delete(key);
  store.set(key, { at: Date.now(), value });
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}

export function clearPageCache(prefix?: string): void {
  if (!prefix) {
    store.clear();
    return;
  }
  Array.from(store.keys()).forEach(k => {
    if (k === prefix || k.startsWith(prefix)) store.delete(k);
  });
}
