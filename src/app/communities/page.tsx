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
import Button from '@/components/ui/Button';
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 flex gap-5 lg:gap-6">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <div className="mb-4 sm:mb-6 anim-fade-up">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--fg)]">Communities</h1>
            <p className="text-sm text-[var(--fg3)] mt-1">Find your people across Nepal.</p>
          </div>

          {/* Search + filter bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4 anim-fade-up" style={{ animationDelay: '50ms' }}>
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search communities..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-10 sm:h-10 pl-10 pr-4 text-sm rounded-[var(--r-full)] border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:border-transparent transition-all"
              />
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
          </div>

          {/* Category pills — scrollable on mobile */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-5 -mx-1 px-1 scrollbar-hide anim-fade-up" style={{ animationDelay: '100ms' }}>
            {[{ value: 'all', label: 'All' }, ...COMMUNITY_CATEGORIES].map(c => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-[var(--r-full)] whitespace-nowrap transition-all shrink-0 ${
                  category === c.value
                    ? 'bg-[var(--brand-600)] text-white shadow-sm'
                    : 'bg-[var(--bg-raised)] text-[var(--fg3)] hover:bg-[var(--border)]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Results */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => <CommunitySkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Users className="h-7 w-7" />}
              title={search || category !== 'all' ? 'No communities found' : 'No communities yet'}
              description={search || category !== 'all' ? 'Try a different search or filter.' : 'Be the first to create a community.'}
              action={
                <Link href="/submit">
                  <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Create Community</Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 stagger">
              {filtered.map(c => <CommunityCard key={c.slug} community={c} />)}
            </div>
          )}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
