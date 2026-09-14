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
import Link from 'next/link';
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
        const { data } = await supabase
          .from('communities')
          .select('*')
          .order('member_count', { ascending: false });
        if (data) setCommunities(data as any[]);
      } catch {
        // Supabase not configured
      } finally {
        setLoading(false);
      }
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
      <div className="flex justify-center px-3 py-3 gap-4 max-w-[1400px] mx-auto">
        <div className="hidden lg:block w-[var(--left-sidebar-w)] shrink-0">
          <div className="sticky top-[calc(var(--header-h)+12px)]">
            <Sidebar />
          </div>
        </div>
        <main className="flex-1 min-w-0 max-w-[680px]">
          <h1 className="text-sm font-medium text-[var(--fg)] mb-2">Browse Communities</h1>

          <input
            type="text"
            placeholder="Filter communities"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-8 px-3 text-xs rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-600)] transition-colors mb-2"
          />

          <div className="flex gap-1 overflow-x-auto pb-2 mb-2 scrollbar-hide">
            {[{ value: 'all', label: 'All' }, ...COMMUNITY_CATEGORIES].map(c => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-full whitespace-nowrap transition-colors shrink-0 ${
                  category === c.value
                    ? 'bg-[var(--brand-600)] text-white'
                    : 'bg-[var(--bg-raised)] text-[var(--fg3)] border border-[var(--border)] hover:border-[var(--border-strong)]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-1.5">
              {[1, 2, 3, 4, 5, 6].map(i => <CommunitySkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Users className="h-5 w-5" />}
              title={search || category !== 'all' ? 'No communities found' : 'No communities yet'}
              description={search || category !== 'all' ? 'Try a different search or filter.' : 'Be the first to create a community.'}
            />
          ) : (
            <div className="space-1.5 stagger">
              {filtered.map(c => <CommunityCard key={c.slug} community={c} />)}
            </div>
          )}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
