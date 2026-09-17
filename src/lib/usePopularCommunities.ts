'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface PopularCommunity {
  id: string;
  name: string;
  slug: string;
  member_count: number;
  post_count: number;
  color?: string | null;
  description?: string;
}

// Module-level cache: fetched once per session, shared by Sidebar,
// home-page trending widget, etc. Survives client-side navigation so
// the sidebar never flashes empty or refetches on every page switch.
let cache: PopularCommunity[] | null = null;
let inflight: Promise<PopularCommunity[]> | null = null;

function fetchPopular(limit: number): Promise<PopularCommunity[]> {
  if (!inflight) {
    inflight = (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('communities')
          .select('id, name, slug, member_count, post_count, color, description')
          .order('member_count', { ascending: false })
          .limit(limit);
        if (data) cache = data as PopularCommunity[];
      } catch {
        // Keep stale cache (or empty) on failure
      }
      inflight = null;
      return cache ?? [];
    })();
  }
  return inflight;
}

export function usePopularCommunities(limit = 5): PopularCommunity[] {
  const [communities, setCommunities] = useState<PopularCommunity[] | null>(cache);

  useEffect(() => {
    if (cache) {
      setCommunities(cache);
      return;
    }
    let cancelled = false;
    fetchPopular(limit).then(d => {
      if (!cancelled) setCommunities(d);
    });
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return communities ?? [];
}

// Joined communities for the left nav (Reddit-style "your communities").
// Cached per user for the session so it never flashes or refetches on nav.
const joinedCache = new Map<string, PopularCommunity[]>();
let joinedInflight = new Map<string, Promise<PopularCommunity[]>>();

export function useJoinedCommunities(userId: string | undefined, limit = 10): PopularCommunity[] {
  const [communities, setCommunities] = useState<PopularCommunity[]>(() =>
    userId ? (joinedCache.get(userId) ?? []) : []
  );

  useEffect(() => {
    if (!userId) return;
    const cached = joinedCache.get(userId);
    if (cached) {
      setCommunities(cached);
      return;
    }
    let cancelled = false;
    let promise = joinedInflight.get(userId);
    if (!promise) {
      promise = (async () => {
        try {
          const supabase = createClient();
          const { data } = await supabase
            .from('community_members')
            .select('communities(id, name, slug, member_count, post_count, description)')
            .eq('user_id', userId)
            .order('joined_at', { ascending: false })
            .limit(limit);
          const list = ((data as any[] | null)?.map(r => r.communities).filter(Boolean) ?? []) as PopularCommunity[];
          joinedCache.set(userId, list);
          return list;
        } catch {
          return joinedCache.get(userId) ?? [];
        } finally {
          joinedInflight.delete(userId);
        }
      })();
      joinedInflight.set(userId, promise);
    }
    promise.then(d => {
      if (!cancelled) setCommunities(d);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, limit]);

  return communities;
}

/** Invalidate the joined cache (call after joining/leaving). */
export function invalidateJoinedCommunities(userId: string) {
  joinedCache.delete(userId);
}
