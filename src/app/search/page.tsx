'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import PostList from '@/components/post/PostList';
import type { PostData } from '@/components/post/PostCard';
import CommunityCard from '@/components/community/CommunityCard';
import type { CommunityData } from '@/components/community/CommunityCard';
import { Search as SearchIcon, Users, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const TABS = [
  { key: 'posts', label: 'Posts', icon: FileText },
  { key: 'communities', label: 'Communities', icon: Users },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState<PostData[]>([]);
  const [communities, setCommunities] = useState<CommunityData[]>([]);
  const [searching, setSearching] = useState(false);

  async function handleSearch(q: string) {
    setQuery(q);
    if (q.length < 2) { setPosts([]); setCommunities([]); return; }
    setSearching(true);
    try {
      const supabase = createClient();
      const [postRes, commRes] = await Promise.all([
        supabase.from('posts')
          .select('*, author:profiles!posts_author_id_fkey(username,display_name,avatar_url), community:communities!posts_community_id_fkey(name,slug,color)')
          .eq('is_removed', false).ilike('title', `%${q}%`)
          .order('created_at', { ascending: false }).limit(10),
        supabase.from('communities').select('*')
          .or(`name.ilike.%${q}%,slug.ilike.%${q}%`)
          .order('member_count', { ascending: false }).limit(10),
      ]);
      if (postRes.data) setPosts(postRes.data.map(p => ({ ...p, author: p.author || { username: 'unknown' }, community: p.community || undefined })));
      if (commRes.data) setCommunities(commRes.data);
    } catch { /* not configured */ } finally { setSearching(false); }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="relative mb-5 anim-fade-up">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--fg4)]" />
          <input
            type="text" value={query} onChange={e => handleSearch(e.target.value)}
            placeholder="Search posts, communities..."
            className="w-full h-11 sm:h-12 pl-11 sm:pl-12 pr-4 text-sm sm:text-base rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:border-transparent transition-all"
            autoFocus
          />
          {searching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--fg4)] animate-spin" />}
        </div>

        {query.length >= 2 && (
          <div className="flex items-center gap-1 border-b border-[var(--border)] mb-5 anim-fade-up">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={cn('flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                    activeTab === tab.key ? 'border-[var(--brand-600)] text-[var(--brand-600)]' : 'border-transparent text-[var(--fg4)] hover:text-[var(--fg3)]'
                  )}>
                  <Icon className="h-4 w-4" /> {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {query.length < 2 ? (
          <div className="py-16 text-center anim-fade-up">
            <div className="h-14 w-14 rounded-2xl bg-[var(--bg-raised)] flex items-center justify-center mx-auto mb-4">
              <SearchIcon className="h-7 w-7 text-[var(--fg4)]" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-[var(--fg)] mb-1">Explore Kura</h2>
            <p className="text-sm text-[var(--fg4)] max-w-sm mx-auto">Search for posts, communities, or topics that interest you.</p>
          </div>
        ) : (
          <div className="anim-fade-up pb-20 lg:pb-8">
            {activeTab === 'posts' && <PostList posts={posts} emptyTitle="No posts found" emptyDescription={`No results for "${query}"`} />}
            {activeTab === 'communities' && (
              communities.length === 0 ? (
                <p className="py-12 text-center text-sm text-[var(--fg4)]">No communities found for &ldquo;{query}&rdquo;</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 stagger">
                  {communities.map(c => <CommunityCard key={c.slug} community={c} />)}
                </div>
              )
            )}
          </div>
        )}
      </div>
      <MobileNav />
    </div>
  );
}
