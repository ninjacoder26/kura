'use client';

import { useState, useRef, useCallback } from 'react';
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
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const doSearch = useCallback(async (q: string) => {
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
      if (postRes.data) setPosts((postRes.data as any[]).map((p: any) => ({ ...p, author: p.author || { username: 'unknown' }, community: p.community || undefined })));
      if (commRes.data) setCommunities(commRes.data as any[]);
    } catch { /* not configured */ } finally { setSearching(false); }
  }, []);

  function handleSearch(q: string) {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setPosts([]); setCommunities([]); return; }
    debounceRef.current = setTimeout(() => doSearch(q), 300);
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-[640px] px-4 py-3">
        <div className="relative mb-3">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg4)]" />
          <input
            type="text" value={query} onChange={e => handleSearch(e.target.value)}
            placeholder="Search Kura"
            className="w-full h-10 pl-10 pr-4 text-sm rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-600)] transition-colors"
            autoFocus
          />
          {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg4)] animate-spin" />}
        </div>

        {query.length >= 2 && (
          <div className="flex items-center gap-0 border-b border-[var(--border)] mb-3">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={cn('flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold border-b-2 transition-colors',
                    activeTab === tab.key ? 'border-[var(--brand-600)] text-[var(--brand-600)]' : 'border-transparent text-[var(--fg4)] hover:text-[var(--fg3)]'
                  )}>
                  <Icon className="h-4 w-4" /> {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {query.length < 2 ? (
          <div className="py-20 text-center">
            <div className="h-12 w-12 rounded-full bg-[var(--bg-raised)] flex items-center justify-center mx-auto mb-3 border border-[var(--border)]">
              <SearchIcon className="h-6 w-6 text-[var(--fg4)]" />
            </div>
            <h2 className="text-lg font-medium text-[var(--fg)] mb-1">Search Kura</h2>
            <p className="text-sm text-[var(--fg4)]">Find posts, communities, and more.</p>
          </div>
        ) : (
          <div className="pb-20 lg:pb-8">
            {activeTab === 'posts' && <PostList posts={posts} emptyTitle="No posts found" emptyDescription={`No results for "${query}"`} />}
            {activeTab === 'communities' && (
              communities.length === 0 ? (
                <p className="py-16 text-center text-sm text-[var(--fg4)]">No communities found for &ldquo;{query}&rdquo;</p>
              ) : (
                <div className="space-y-2 stagger">
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
