'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import Sidebar from '@/components/layout/Sidebar';
import CommunityCard from '@/components/community/CommunityCard';
import type { CommunityData } from '@/components/community/CommunityCard';
import { CommunitySkeleton, EmptyState } from '@/components/ui/Feedback';
import { Users } from 'lucide-react';
import { COMMUNITY_CATEGORIES } from '@/lib/constants';

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<CommunityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => { setPage(0); setCommunities([]); setHasMore(true); }, [category]);

  useEffect(() => {
    async function load() {
      if (page === 0) setLoading(true);
      else setLoadingMore(true);
      try {
        const supabase = createClient();
        let query = supabase.from('communities').select('*').order('member_count', { ascending: false });
        if (category !== 'all') query = query.eq('category', category);
        query = query.range(page * 20, (page + 1) * 20 - 1);
        const { data } = await query;
        if (data) {
          setCommunities(prev => page === 0 ? (data as any[]) : [...prev, ...(data as any[])]);
          setHasMore(data.length === 20);
        }
      } catch { } finally { setLoading(false); setLoadingMore(false); }
    }
    load();
  }, [category, page]);

  const filtered = communities.filter(c => {
    return !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.includes(search.toLowerCase());
  });

  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex px-4 py-3 gap-5">
        <aside className="hidden lg:block w-[228px] shrink-0">
          <div className="sticky top-[60px]"><Sidebar /></div>
        </aside>
        <main className="flex-1 min-w-0">
          <h1 className="text-lg font-medium text-[var(--fg)] mb-3">Browse Communities</h1>
          <input type="text" placeholder="Filter communities" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-10 px-4 text-sm rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-600)] transition-colors mb-3" />
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
            {[{ value: 'all', label: 'All' }, ...COMMUNITY_CATEGORIES].map(c => (
              <button key={c.value} onClick={() => setCategory(c.value)}
                className={`px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-colors shrink-0 ${category === c.value ? 'bg-[var(--brand-600)] text-white' : 'bg-[var(--bg-raised)] text-[var(--fg3)] border border-[var(--border)] hover:border-[var(--border-strong)]'}`}>
                {c.label}
              </button>
            ))}
          </div>
          {loading ? (
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
      <MobileNav />
    </div>
  );
}
