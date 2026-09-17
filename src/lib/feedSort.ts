// Shared Reddit-style feed sorting (home + community pages).

export type FeedSort = 'hot' | 'new' | 'top' | 'rising';
export type TopRange = 'day' | 'week' | 'month' | 'all';

export const FEED_SORTS: { key: FeedSort; label: string }[] = [
  { key: 'hot', label: 'Hot' },
  { key: 'new', label: 'New' },
  { key: 'top', label: 'Top' },
  { key: 'rising', label: 'Rising' },
];

export const TOP_RANGES: { key: TopRange; label: string; days: number | null }[] = [
  { key: 'day', label: 'Today', days: 1 },
  { key: 'week', label: 'Week', days: 7 },
  { key: 'month', label: 'Month', days: 30 },
  { key: 'all', label: 'All', days: null },
];

/** Cut-off ISO timestamp for a top-range filter (null = all time). */
export function topRangeCutoff(range: TopRange): string | null {
  const found = TOP_RANGES.find(r => r.key === range);
  if (!found || found.days === null) return null;
  return new Date(Date.now() - found.days * 24 * 60 * 60 * 1000).toISOString();
}

/** Rising = posted in the last 7 days. */
export function risingCutoff(): string {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}
