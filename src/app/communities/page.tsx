'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import CommunityCard from '@/components/community/CommunityCard';
import type { CommunityData } from '@/components/community/CommunityCard';
import { CommunitySkeleton, EmptyState } from '@/components/ui/Feedback';
import { Users, Plus } from 'lucide-react';
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
      <div className="max-w-[1200px] mx-auto px-4 py-4 flex gap-6">
        <Sidebar />
        <main className="flex-1 min-w-0 max-w-[740px]">
          <div className="mb-4 anim-fade-up">
            <h1 className="text-lg font-medium text-[var(--fg)]">Browse Communities</h1>
            <p className="text-xs text-[var(--fg4)] mt-1">Find your people across Nepal.</p>
          </div>

          {/* Search */}
          <div className="mb-3 anim-fade-up">
            <input
              type="text"
              placeholder="Filter communities"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-600)] transition-colors"
            />
          </div>

          {/* Category pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-hide anim-fade-up">
            {[{ value: 'all', label: 'All' }, ...COMMUNITY_CATEGORIES].map(c => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap transition-colors shrink-0 ${
                  category === c.value
                    ? 'bg-[var(--brand-600)] text-white'
                    : 'bg-[var(--bg-raised)] text-[var(--fg3)] border border-[var(--border)] hover:border-[var(--border-strong)]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Results */}
          {loading ? (
            <div className="space-2">
              {[1, 2, 3, 4, 5, 6].map(i => <CommunitySkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title={search || category !== 'all' ? 'No communities found' : 'No communities yet'}
              description={search || category !== 'all' ? 'Try a different search or filter.' : 'Be the first to create a community.'}
              action={
                <Link href="/submit">
                  <button className="reddit-btn bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] text-xs">
                    Create Community
                  </button>
                </Link>
              }
            />
          ) : (
            <div className="space-2 stagger">
              {filtered.map(c => <CommunityCard key={c.slug} community={c} />)}
            </div>
          )}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
