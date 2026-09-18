'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import PostList from '@/components/post/PostList';
import type { PostData } from '@/components/post/PostCard';
import CommunityCard from '@/components/community/CommunityCard';
import type { CommunityData } from '@/components/community/CommunityCard';
import { Search as SearchIcon, Users, FileText, Loader2, TrendingUp, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { fetchAndCacheVotes, useSyncFeedVotes } from '@/lib/feedVoteCache';
import { getPageCache, setPageCache, hasPageCache, isCacheFresh } from '@/lib/pageCache';
import { useAuth } from '@/components/providers/AuthProvider';
import { usePopularCommunities } from '@/lib/usePopularCommunities';
import { COMMUNITY_CATEGORIES } from '@/lib/constants';
import Link from 'next/link';

const TABS = [
  { key: 'posts', label: 'Posts', icon: FileText },
  { key: 'communities', label: 'Communities', icon: Users },
  { key: 'people', label: 'People', icon: Users },
];

interface PersonResult {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

function PersonRow({ person }: { person: PersonResult }) {
  return (
    <Link href={`/profile/${person.username}`} className="block">
      <div className="post-card flex items-center gap-3 p-3 hover:border-[var(--border-strong)] transition-colors">
        <div className="h-12 w-12 rounded-full bg-[var(--brand-500)] flex items-center justify-center text-white font-bold text-base shrink-0 overflow-hidden">
          {person.avatar_url ? (
            <img src={person.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            (person.display_name || person.username || '?').charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm text-[var(--fg)] truncate">{person.display_name || person.username}</p>
          <p className="text-xs text-[var(--fg4)]">u/{person.username}</p>
          {person.bio && <p className="text-xs text-[var(--fg4)] mt-0.5 line-clamp-1">{person.bio}</p>}
        </div>
      </div>
    </Link>
  );
}

function DiscoverTopics({ onPick }: { onPick?: (label: string) => void }) {
  // Rendered inside Discover; split out so topic chips are reusable.
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {COMMUNITY_CATEGORIES.slice(0, 12).map(c => (
        <button
          key={c.value}
          onClick={() => onPick?.(c.label)}
          className="px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-colors shrink-0 bg-[var(--bg-raised)] text-[var(--fg3)] border border-[var(--border)] hover:border-[var(--brand-500)] hover:text-[var(--brand-500)]"
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

function SearchPageInner() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQ);
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState<PostData[]>([]);
  const [communities, setCommunities] = useState<CommunityData[]>([]);
  const [people, setPeople] = useState<PersonResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef(0);
  const userRef = useRef(user);
  userRef.current = user;
  useSyncFeedVotes(posts, user?.id);

  function escapeIlike(str: string) {
    return str.replace(/[,()]/g, '').replace(/%/g, '\\%').replace(/_/g, '\\_');
  }

  const doSearch = useCallback(async (q: string) => {
    const requestId = ++requestRef.current;
    if (q.length < 2) { setPosts([]); setCommunities([]); setPeople([]); setSearched(false); return; }
    setSearching(true);
    setSearched(true);
    const escaped = escapeIlike(q);
    // Exact-tag matches (tags are normalized lowercase-hyphen) OR title text
    const qTrim = q.trim().toLowerCase();
    const tagTerm = /^[a-z0-9-]{2,24}$/.test(qTrim) ? `,tags.cs.{${qTrim}}` : '';
    try {
      const supabase = createClient();
      const [postRes, commRes, peopleRes] = await Promise.all([
        supabase.from('posts').select('*, author:profiles!posts_author_id_fkey(username,display_name,avatar_url,role), community:communities!posts_community_id_fkey(id,name,slug,color,icon_url)').eq('is_removed', false).or(`title.ilike.%${escaped}%${tagTerm}`).order('created_at', { ascending: false }).limit(10),
        supabase.from('communities').select('*').or(`name.ilike.%${escaped}%,slug.ilike.%${escaped}%`).order('member_count', { ascending: false }).limit(10),
        supabase.from('profiles').select('username, display_name, avatar_url, bio').or(`username.ilike.%${escaped}%,display_name.ilike.%${escaped}%`).limit(10),
      ]);
      // Ignore stale responses from earlier keystrokes
      if (requestRef.current !== requestId) return;
      if (postRes.data) {
        setPosts((postRes.data as any[]).map((p: any) => ({ ...p, author: p.author || { username: 'unknown' }, community: p.community || undefined })));
        const uid = userRef.current?.id;
        if (uid) fetchAndCacheVotes(supabase, uid, (postRes.data as any[]).map((p: any) => p.id));
      }
      if (commRes.data) setCommunities(commRes.data as any[]);
      if (peopleRes.data) setPeople(peopleRes.data as PersonResult[]);
    } catch {
      // Keep previous results on transient failure
    } finally {
      if (requestRef.current === requestId) setSearching(false);
    }
  }, []);

  function handleSearch(q: string) {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) {
      requestRef.current++;
      setPosts([]); setCommunities([]); setPeople([]);
      setSearching(false); setSearched(false);
      return;
    }
    debounceRef.current = setTimeout(() => doSearch(q), 300);
  }

  // Deep-linked searches (e.g. tapping a #tag chip) run once on mount
  useEffect(() => {
    if (initialQ.length >= 2) doSearch(initialQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showResults = query.length >= 2;

  return (
    <div className="flex px-3 sm:px-4 py-3 gap-4 sm:gap-5 w-full">
      <aside className="hidden lg:block w-[272px] shrink-0">
        <div className="sticky top-12"><Sidebar /></div>
      </aside>

      <main className="flex-1 min-w-0 max-w-[740px] mx-auto w-full">
        <div className="relative mb-3">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg4)]" />
          <input type="text" value={query} onChange={e => handleSearch(e.target.value)} placeholder="Search Kura"
            className="w-full h-10 pl-10 pr-4 text-sm rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-500)] transition-colors" />
          {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg4)] animate-spin" />}
        </div>

        {!showResults ? (
          <Discover onPick={handleSearch} />
        ) : (
          <div className="pb-20 lg:pb-8">
            <div className="flex items-center gap-0 border-b border-[var(--border)] mb-3">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={cn('flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold border-b-2 transition-colors', activeTab === tab.key ? 'border-[var(--brand-500)] text-[var(--brand-500)]' : 'border-transparent text-[var(--fg4)] hover:text-[var(--fg3)]')}>
                    <Icon className="h-4 w-4" /> {tab.label}
                  </button>
                );
              })}
            </div>
            {activeTab === 'posts' && (
              searching && posts.length === 0 ? (
                <div className="space-y-2">{[1, 2].map(i => <div key={i} className="post-card p-4"><div className="h-4 w-2/3 rounded skeleton mb-2" /><div className="h-3 w-full rounded skeleton" /></div>)}</div>
              ) : (
                <PostList posts={posts} emptyTitle={searched && !searching ? 'No posts found' : 'Keep typing to search'} emptyDescription={searched && !searching ? `No results for "${query}"` : 'Results appear as you type.'} />
              )
            )}
            {activeTab === 'communities' && (communities.length === 0 ? (
              <p className="py-16 text-center text-sm text-[var(--fg4)]">{searching ? 'Searching…' : `No communities found for “${query}”`}</p>
            ) : (
              <div className="space-y-2 stagger">{communities.map(c => <CommunityCard key={c.slug} community={c} />)}</div>
            ))}
            {activeTab === 'people' && (people.length === 0 ? (
              <p className="py-16 text-center text-sm text-[var(--fg4)]">{searching ? 'Searching…' : `No people found for “${query}”`}</p>
            ) : (
              <div className="space-y-2 stagger">{people.map(p => <PersonRow key={p.username} person={p} />)}</div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Discover feed: trending posts + popular communities + topic shortcuts.
// Pure content component so Explore never renders an empty page.
function Discover({ onPick }: { onPick: (q: string) => void }) {
  const { user } = useAuth();
  const popular = usePopularCommunities(5);
  const [trending, setTrending] = useState<PostData[]>(() => getPageCache<{ posts: PostData[] }>('discover:trending')?.posts ?? []);
  const [loadingTrending, setLoadingTrending] = useState(() => !hasPageCache('discover:trending'));
  const userRef = useRef(user);
  userRef.current = user;
  useSyncFeedVotes(trending, user?.id);

  useEffect(() => {
    let cancelled = false;
    // Fresh cache (<30s): skip the refetch entirely on revisit
    if (isCacheFresh('discover:trending')) {
      setLoadingTrending(false);
      return () => { cancelled = true; };
    }
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('posts')
          .select('*, author:profiles!posts_author_id_fkey(username,display_name,avatar_url,role), community:communities!posts_community_id_fkey(id,name,slug,color,icon_url)')
          .eq('is_removed', false)
          .order('upvotes', { ascending: false })
          .limit(6);
        if (!cancelled && data) {
          const mapped = (data as any[]).map((p: any) => ({
            ...p,
            author: p.author || { username: 'unknown' },
            community: p.community || undefined,
          }));
          // Claim vote state synchronously so cards mount warm
          const uid = userRef.current?.id;
          if (uid) fetchAndCacheVotes(supabase, uid, mapped.map((p: any) => p.id));
          setTrending(mapped);
          setPageCache('discover:trending', { posts: mapped });
        }
      } catch {
        // Discover still shows communities even if trending fails
      } finally {
        if (!cancelled) setLoadingTrending(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-4 pb-20 lg:pb-8">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--fg4)] mb-2">Browse by topic</h2>
        <DiscoverTopics onPick={onPick} />
      </div>

      <div>
        <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--fg4)] mb-2">
          <TrendingUp className="h-4 w-4" /> Trending today
        </h2>
        {loadingTrending && trending.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="post-card p-4"><div className="h-4 w-2/3 rounded skeleton mb-2" /><div className="h-3 w-full rounded skeleton" /></div>)}
          </div>
        ) : (
          <PostList posts={trending} emptyTitle="Nothing trending yet" emptyDescription="Be the first to post something!" />
        )}
      </div>

      {popular.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--fg4)] mb-2">Popular communities</h2>
          <div className="space-y-2">
            {popular.map(c => (
              <CommunityCard
                key={c.slug}
                community={{ id: c.id, name: c.name, slug: c.slug, description: c.description, color: c.color || '#0079D3', member_count: c.member_count, post_count: c.post_count, category: 'general' }}
              />
            ))}
          </div>
          <Link href="/communities" className="flex items-center justify-center gap-1 mt-2 px-2 py-2 text-xs font-bold text-[var(--brand-500)] hover:bg-[var(--surface-hover)] rounded transition-colors">
            View All <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex px-3 sm:px-4 py-3 gap-4 sm:gap-5 w-full">
          <div className="flex-1 min-w-0 max-w-[740px] mx-auto w-full">
            <div className="h-10 rounded skeleton mb-3" />
          </div>
        </div>
      }
    >
      <SearchPageInner />
    </Suspense>
  );
}
