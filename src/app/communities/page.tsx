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
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase.from('communities').select('*').order('member_count', { ascending: false });
        if (data) setCommunities(data as any[]);
      } catch { } finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = communities.filter(c => {
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.includes(search.toLowerCase());
    const matchesCategory = category === 'all' || c.category === category;
    return matchesSearch && matchesCategory;
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
            <div className="space-y-2 stagger">{filtered.map(c => <CommunityCard key={c.slug} community={c} />)}</div>
          )}
          <div className="pb-20 lg:pb-6" />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
