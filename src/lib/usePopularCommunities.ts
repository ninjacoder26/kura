'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface PopularCommunity {
  id: string;
  name: string;
  slug: string;
  member_count: number;
  post_count: number;
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
          .select('id, name, slug, member_count, post_count, description')
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
