'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getPageCache, setPageCache, hasPageCache, isCacheFresh } from '@/lib/pageCache';
import Sidebar from '@/components/layout/Sidebar';
import CommunityCard from '@/components/community/CommunityCard';
import type { CommunityData } from '@/components/community/CommunityCard';
import { CommunitySkeleton, EmptyState } from '@/components/ui/Feedback';
import { Users } from 'lucide-react';
import { COMMUNITY_CATEGORIES } from '@/lib/constants';

export default function CommunitiesPage() {
  const [category, setCategory] = useState('all');
  const listKey = `communities:${category}`;
  // Seed from cache: revisits render instantly, revalidate happens below.
  const [communities, setCommunities] = useState<CommunityData[]>(() => getPageCache<{ list: CommunityData[] }>(listKey)?.list ?? []);
  const [loading, setLoading] = useState(() => !hasPageCache(listKey));
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => { setPage(0); setHasMore(true); }, [category]);

  useEffect(() => {
    let cancelled = false;
    // Fresh cache (<30s): skip the refetch entirely on revisit
    if (page === 0 && isCacheFresh(listKey)) {
      setLoading(false);
      return () => {};
    }
    async function load() {
      if (page === 0) setLoading(true);
      else setLoadingMore(true);
      try {
        const supabase = createClient();
        let query = supabase.from('communities').select('*').order('member_count', { ascending: false });
        if (category !== 'all') query = query.eq('category', category);
        query = query.range(page * 20, (page + 1) * 20 - 1);
        const { data } = await query;
        if (!cancelled && data) {
          const more = data.length === 20;
          setCommunities(prev => {
            const next = page === 0 ? (data as any[]) : [...prev, ...(data as any[])];
            setPageCache(listKey, { list: next, hasMore: more });
            return next;
          });
          setHasMore(more);
        }
      } catch { } finally { if (!cancelled) { setLoading(false); setLoadingMore(false); } }
    }
    load();
    return () => { cancelled = true; };
  }, [category, page]);

  const filtered = communities.filter(c => {
    return !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.includes(search.toLowerCase());
  });

  return (
      <div className="flex px-3 sm:px-4 py-3 gap-4 sm:gap-5 w-full max-w-[1460px] mx-auto">
        <aside className="hidden lg:block w-[272px] shrink-0">
          <div className="sticky top-12"><Sidebar /></div>
        </aside>
        <main className="flex-1 min-w-0 w-full max-w-[960px]">
          <div className="flex items-center gap-2 mb-3">
            <h1 className="text-lg font-medium text-[var(--fg)]">Browse Communities</h1>
            {loading && filtered.length > 0 && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand-500)] border-t-transparent" />
            )}
          </div>
          <input type="text" placeholder="Filter communities" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-10 px-4 text-sm rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-500)] transition-colors mb-3" />
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
            {[{ value: 'all', label: 'All' }, ...COMMUNITY_CATEGORIES].map(c => (
              <button key={c.value} onClick={() => setCategory(c.value)}
                className={`px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-colors shrink-0 ${category === c.value ? 'bg-[var(--brand-500)] text-white' : 'bg-[var(--bg-raised)] text-[var(--fg3)] border border-[var(--border)] hover:border-[var(--border-strong)]'}`}>
                {c.label}
              </button>
            ))}
          </div>
          {loading && filtered.length === 0 ? (
            <div className="space-y-2">{[1, 2, 3, 4, 5, 6].map(i => <CommunitySkeleton key={i} />)}</div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Users className="h-5 w-5" />} title={search || category !== 'all' ? 'No communities found' : 'No communities yet'} description={search || category !== 'all' ? 'Try a different search or filter.' : 'Be the first to create a community.'} />
          ) : (
            <>
              <div className="space-y-2 stagger">{filtered.map(c => <CommunityCard key={c.slug} community={c} />)}</div>
              {loadingMore && <div className="space-y-2 mt-2">{[1, 2].map(i => <CommunitySkeleton key={i} />)}</div>}
              {hasMore && !search && (
                <div className="flex justify-center mt-4">
                  <button onClick={() => setPage(p => p + 1)} disabled={loadingMore}
                    className="kura-btn border border-[var(--border)] text-[var(--fg2)] hover:border-[var(--border-strong)] bg-transparent text-sm">
                    {loadingMore ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
          <div className="pb-20 lg:pb-6" />
        </main>
      </div>
  );
}
