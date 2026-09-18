'use client';

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Per-user tag affinity for the home recommendation feed.
 *
 * Built from the tags of posts the user upvoted (latest 200). Cached per
 * session and updated write-through on every vote, so recommendations
 * react instantly without refetching. Deliberately soft: affinity nudges
 * ranking inside each page, it never overrides recency/score globally.
 */

const affCache = new Map<string, Map<string, number>>();
const affInflight = new Map<string, Promise<Map<string, number>>>();

export async function getTagAffinity(
  supabase: SupabaseClient<any>,
  userId: string
): Promise<Map<string, number>> {
  const cached = affCache.get(userId);
  if (cached) return cached;
  let p = affInflight.get(userId);
  if (!p) {
    p = (async () => {
      const map = new Map<string, number>();
      try {
        const { data } = await supabase
          .from('votes')
          .select('post:posts(tags)')
          .eq('user_id', userId)
          .eq('value', 1)
          .not('post_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(200);
        for (const row of (data as any[]) || []) {
          const tags = row?.post?.tags;
          if (!Array.isArray(tags)) continue;
          for (const t of tags) {
            if (typeof t === 'string' && t) map.set(t, (map.get(t) ?? 0) + 1);
          }
        }
      } catch {
        // No affinity yet — feed falls back to pure sort order.
      }
      affCache.set(userId, map);
      affInflight.delete(userId);
      return map;
    })();
    affInflight.set(userId, p);
  }
  return p;
}

/** Write-through: upvotes add affinity, un-votes remove it. */
export function bumpTagAffinity(
  userId: string,
  tags: string[] | null | undefined,
  delta: 1 | -1
): void {
  if (!tags) return;
  let map = affCache.get(userId);
  if (!map) {
    map = new Map<string, number>();
    affCache.set(userId, map);
  }
  for (const t of tags) {
    if (typeof t !== 'string' || !t) continue;
    map.set(t, Math.max(0, (map.get(t) ?? 0) + delta));
  }
}

/** Soft boost, capped so beloved topics nudge rather than dictate order. */
export function tagBoost(
  aff: Map<string, number> | null,
  tags: string[] | null | undefined
): number {
  if (!aff || !tags) return 0;
  let s = 0;
  for (const t of tags) s += aff.get(t) ?? 0;
  return Math.min(s, 12);
}
