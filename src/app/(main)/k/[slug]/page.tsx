'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { requireSession, friendlyDbError } from '@/lib/dbErrors';
import { fetchAndCacheVotes, useSyncFeedVotes } from '@/lib/feedVoteCache';
import { getPageCache, setPageCache, isCacheFresh } from '@/lib/pageCache';
import { invalidateJoinedCommunities } from '@/lib/usePopularCommunities';
import Link from 'next/link';
import JoinButton from '@/components/community/JoinButton';
import PostList from '@/components/post/PostList';
import type { PostData } from '@/components/post/PostCard';
import { LoadingSpinner, EmptyState } from '@/components/ui/Feedback';
import { Calendar, Shield, Plus } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { FEED_SORTS, TOP_RANGES, topRangeCutoff, risingCutoff, type FeedSort, type TopRange } from '@/lib/feedSort';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';

export default function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [community, setCommunity] = useState<any>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [similar, setSimilar] = useState<any[]>([]);
  const [sort, setSort] = useState<FeedSort>('hot');
  const [topRange, setTopRange] = useState<TopRange>('week');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const userRef = useRef(user);
  userRef.current = user;
  const reqRef = useRef(0);
  const communityRef = useRef<any>(null);
  const sortRef = useRef(sort);
  sortRef.current = sort;
  const topRangeRef = useRef(topRange);
  topRangeRef.current = topRange;
  useSyncFeedVotes(posts, user?.id);

  useEffect(() => {
    let cancelled = false;
    params.then(p => {
      if (cancelled) return;
      // Seed instantly from cache (revalidate happens right after)
      const sk = sortRef.current;
      const tr = topRangeRef.current;
      const cached = getPageCache<{ posts: PostData[]; hasMore: boolean }>(`k:${p.slug}:${sk}:${tr}`);
      const meta = getPageCache<any>(`kmeta:${p.slug}`);
      setCommunity(meta ?? null);
      communityRef.current = meta ?? null;
      setPosts(cached?.posts ?? []);
      setHasMore(cached?.hasMore ?? true);
      setIsMember(false);
      setError('');
      setLoading(!(cached || meta));
      setSlug(p.slug);
    });
    return () => { cancelled = true; };
  }, [params]);

  const load = useCallback(async (pageNum: number = 0) => {
    if (!slug) return;
    // Only page-0 loads participate in staleness tracking — appends must
    // never be dropped by a newer request.
    const myReq = pageNum === 0 ? ++reqRef.current : reqRef.current;
    const currentUser = userRef.current;
    const postsKey = `k:${slug}:${sort}:${topRange}`;
    // Fresh cache (<30s): skip the refetch entirely on revisit
    if (pageNum === 0 && isCacheFresh(postsKey) && communityRef.current) {
      setLoading(false);
      return;
    }
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const supabase = createClient();

      // Posts filtered by community SLUG server-side (!inner join) so this
      // runs in PARALLEL with the community fetch — one round trip total.
      let postsQuery = supabase
        .from('posts')
        .select('*, author:profiles!posts_author_id_fkey(username,display_name,avatar_url,role), community:communities!inner(id,name,slug,color,icon_url)')
        .eq('is_removed', false)
        .eq('community.slug', slug);

      if (sort === 'new') postsQuery = postsQuery.order('created_at', { ascending: false });
      else if (sort === 'top') {
        postsQuery = postsQuery.order('upvotes', { ascending: false });
        const cutoff = topRangeCutoff(topRange);
        if (cutoff) postsQuery = postsQuery.gte('created_at', cutoff);
      }
      else if (sort === 'rising') postsQuery = postsQuery.gte('created_at', risingCutoff()).order('upvotes', { ascending: false });
      else postsQuery = postsQuery.order('upvotes', { ascending: false }).order('downvotes', { ascending: true });

      postsQuery = postsQuery.range(pageNum * 20, (pageNum + 1) * 20 - 1);

      const needMeta = pageNum === 0 && !communityRef.current;
      const [commResult, postsResult] = await Promise.all([
        needMeta
          ? supabase.from('communities').select('*').eq('slug', slug).single()
          : Promise.resolve({ data: communityRef.current, error: null } as any),
        postsQuery,
      ]);

      // Stale page-0 response (sort/slug changed mid-flight) — drop it
      if (pageNum === 0 && reqRef.current !== myReq) return;

      if (commResult.error) throw commResult.error;
      const comm = commResult.data;
      communityRef.current = comm;
      setCommunity(comm);
      setPageCache(`kmeta:${slug}`, comm);

      if (currentUser && comm) {
        const { data: member } = await supabase.from('community_members').select('id').eq('community_id', comm.id).eq('user_id', currentUser.id).single();
        setIsMember(!!member);
      }

      if (postsResult.error) throw postsResult.error;
      const mapped = ((postsResult.data as any[]) || []).map((p: any) => ({
        ...p,
        author: p.author || { username: 'unknown' },
        community: p.community || undefined,
      }));

      // Batch vote/save state in 2 queries (claims sync so cards mount warm)
      if (currentUser) fetchAndCacheVotes(supabase, currentUser.id, mapped.map((p: any) => p.id));
      const more = mapped.length === 20;
      setPosts(prev => {
        const next = pageNum === 0 ? mapped : [...prev, ...mapped];
        if (pageNum === 0) setPageCache(postsKey, { posts: next, hasMore: more });
        else {
          const prevCached = getPageCache<{ posts: PostData[] }>(postsKey);
          if (prevCached) setPageCache(postsKey, { posts: [...prevCached.posts, ...mapped], hasMore: more });
        }
        return next;
      });
      setHasMore(more);
    } catch (err: any) { if (pageNum !== 0 || reqRef.current === myReq) setError(err.message || 'Failed to load community'); } finally { if (pageNum !== 0 || reqRef.current === myReq) { setLoading(false); setLoadingMore(false); } }
  }, [slug, sort, topRange]);

  useEffect(() => { load(0); setPage(0); }, [load]);

  // Re-check membership when user changes (login/logout)
  useEffect(() => {
    if (!community) return;
    if (!user) { setIsMember(false); return; }
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from('community_members').select('id').eq('community_id', community.id).eq('user_id', user.id).single();
      setIsMember(!!data);
    })();
  }, [user, community?.id]);

  // Similar communities (same category) for the rail
  useEffect(() => {
    if (!community?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        let q = supabase.from('communities').select('id, name, slug, color, icon_url, member_count').order('member_count', { ascending: false }).neq('id', community.id).limit(5);
        if (community.category) q = q.eq('category', community.category);
        const { data } = await q;
        if (!cancelled && data) setSimilar(data as any[]);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [community?.id, community?.category]);

  function loadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    load(nextPage);
  }

  function handleRetry() {
    setError('');
    setPage(0);
    // Bypass the fresh-cache throttle by clearing this feed's key first
    load(0);
  }

  async function toggleJoin() {
    if (!user) { toast('info', 'Log in to join communities'); return; }
    const wasMember = isMember;
    // Optimistic update
    setIsMember(!wasMember);
    setCommunity((c: any) => c ? { ...c, member_count: c.member_count + (wasMember ? -1 : 1) } : c);
    toast('success', wasMember ? `Left ${community.name}` : `Joined ${community.name}`);

    try {
      const supabase = createClient();
      if (!(await requireSession(supabase, () => {
        toast('error', 'Your session expired. Please log in again.');
        router.push('/login');
      }))) {
        setIsMember(wasMember);
        setCommunity((c: any) => c ? { ...c, member_count: c.member_count + (wasMember ? 1 : -1) } : c);
        return;
      }
      if (wasMember) {
        const { error } = await supabase.from('community_members').delete().eq('community_id', community.id).eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('community_members').insert({ community_id: community.id, user_id: user.id });
        if (error) throw error;
      }
      invalidateJoinedCommunities(user.id);
    } catch (err: any) {
      // Revert on error
      setIsMember(wasMember);
      setCommunity((c: any) => c ? { ...c, member_count: c.member_count + (wasMember ? 1 : -1) } : c);
      toast('error', friendlyDbError(err.message, { authed: true, action: wasMember ? 'leave this community' : 'join this community' }));
    }
  }

  if (loading && !community) return <div className="px-4 py-8"><LoadingSpinner /></div>;

  // Error page only when there is nothing cached to show; otherwise the
  // feed renders with a small inline retry banner (no webpage switching).
  if (!community) {
    return (
        <div className="px-4 py-8">
          <EmptyState title={error || 'Community not found'} action={<Link href="/communities"><button className="kura-btn bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)] text-sm">Browse communities</button></Link>} />
        </div>
    );
  }

  return (
    <div className="bg-[var(--bg)]">
      <div className="h-24 sm:h-32" style={{ backgroundColor: community.color }} />
      <div className="bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="px-4 max-w-[1200px] mx-auto">
          <div className="flex items-end gap-3 -mt-6 pb-3">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-[var(--surface)] shrink-0" style={{ backgroundColor: community.color }}>
              {community.icon_url ? <img src={community.icon_url} alt={community.name} loading="lazy" decoding="async" className="h-full w-full rounded-full object-cover" /> : community.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--fg)]">{community.name}</h1>
                <button onClick={toggleJoin} className={`pressable kura-btn text-sm py-1.5 px-5 ${isMember ? 'border border-[var(--border)] text-[var(--fg2)] bg-transparent hover:border-[var(--border-strong)]' : 'bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)]'}`}>
                  {isMember ? 'Joined' : 'Join'}
                </button>
              </div>
              <p className="text-sm text-[var(--fg4)]">k/{community.slug}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex px-3 sm:px-4 py-3 sm:py-4 gap-4 sm:gap-5 max-w-[1200px] mx-auto w-full">
        <main className="flex-1 min-w-0">
          {error && (
            <div className="post-card p-3 mb-3 flex items-center gap-2">
              <p className="flex-1 text-xs text-[var(--error)]">{error}</p>
              <button onClick={handleRetry} className="kura-btn border border-[var(--border)] text-[var(--fg2)] hover:border-[var(--border-strong)] bg-transparent text-xs shrink-0">
                Retry
              </button>
            </div>
          )}
          <Link href={`/submit?community=${community.slug}`} className="block mb-3">
            <div className="post-card flex items-center gap-3 p-3 hover:border-[var(--border-strong)] transition-colors">
              <div className="h-9 w-9 rounded-full bg-[var(--surface-hover)] flex items-center justify-center border border-[var(--border)] shrink-0">
                <Plus className="h-5 w-5 text-[var(--fg4)]" />
              </div>
              <span className="text-sm text-[var(--fg4)]">Create a post in {community.name}...</span>
            </div>
          </Link>

          {/* Sort tabs — Reddit style, sticky while scrolling */}
          <div className="post-card flex items-center gap-1 px-3 py-2 mb-3 flex-wrap sticky top-12 z-20">
            {FEED_SORTS.map(({ key, label }) => (
              <button key={key} onClick={() => { setSort(key); setPage(0); }}
                className={cn('text-sm font-bold px-3 py-1.5 rounded-full hover:bg-[var(--surface-hover)] transition-colors', sort === key ? 'text-[var(--fg)]' : 'text-[var(--fg4)]')}>
                {label}
              </button>
            ))}
            {sort === 'top' && (
              <span className="flex items-center gap-1 ml-1 pl-2 border-l border-[var(--border)]">
                {TOP_RANGES.map(r => (
                  <button key={r.key} onClick={() => { setTopRange(r.key); setPage(0); }}
                    className={cn('text-[11px] font-bold px-2 py-1 rounded-full transition-colors', topRange === r.key ? 'bg-[var(--brand-500)] text-white' : 'text-[var(--fg4)] hover:bg-[var(--surface-hover)]')}>
                    {r.label}
                  </button>
                ))}
              </span>
            )}
            {loading && posts.length > 0 && (
              <div className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand-500)] border-t-transparent" />
            )}
          </div>

          <PostList posts={posts} showCommunity={false} />

          {loadingMore && <div className="mt-3"><LoadingSpinner /></div>}

          {hasMore && posts.length > 0 && !loadingMore && (
            <div className="flex justify-center mt-4">
              <button onClick={loadMore} className="kura-btn border border-[var(--border)] text-[var(--fg2)] hover:border-[var(--border-strong)] bg-transparent text-sm">
                Load More
              </button>
            </div>
          )}

          <div className="pb-20 lg:pb-6" />
        </main>

        <aside className="hidden lg:block w-[312px] shrink-0">
          <div className="sticky top-12 space-y-4">
            <div className="sidebar-widget">
              <div className="sidebar-widget-header">About Community</div>
              <div className="p-3">
                <p className="text-sm text-[var(--fg2)] leading-relaxed">{community.description}</p>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border)] text-sm tabular-nums">
                  <div><p className="font-bold text-[var(--fg)]">{community.member_count?.toLocaleString()}</p><p className="text-[11px] text-[var(--fg4)]">Members</p></div>
                  <div><p className="font-bold text-[var(--fg)]">{community.post_count?.toLocaleString()}</p><p className="text-[11px] text-[var(--fg4)]">Posts</p></div>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--fg4)]">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(community.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <Link href={`/submit?community=${community.slug}`} className="block mt-3">
                  <button className="kura-btn w-full bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)] text-sm py-2">Create Post</button>
                </Link>
                <div className="mt-2">
                  <JoinButton communityId={community.id} communityName={community.name} className="w-full py-2" />
                </div>
              </div>
            </div>
            {community.rules && (
              <div className="sidebar-widget">
                <div className="sidebar-widget-header flex items-center gap-1.5"><Shield className="h-3 w-3" /> Rules</div>
                <div className="p-3 space-y-2">
                  {community.rules.split('\n').filter(Boolean).map((rule: string, i: number) => (
                    <div key={i} className="flex gap-2 text-sm text-[var(--fg2)]"><span className="font-bold text-[var(--fg4)] shrink-0">{i + 1}.</span><span className="break-words">{rule.trim()}</span></div>
                  ))}
                </div>
              </div>
            )}
            {similar.length > 0 && (
              <div className="sidebar-widget">
                <div className="sidebar-widget-header">More like this</div>
                <div className="p-2">
                  {similar.map((c: any) => (
                    <Link
                      key={c.slug}
                      href={`/k/${c.slug}`}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--fg2)] hover:bg-[var(--surface-hover)] transition-colors group"
                    >
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden"
                        style={{ backgroundColor: c.color || 'var(--brand-600)' }}
                      >
                        {c.icon_url ? (
                          <img src={c.icon_url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                        ) : (
                          c.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--fg)] group-hover:underline truncate">k/{c.slug}</p>
                      </div>
                      <span className="text-[11px] text-[var(--fg4)] shrink-0">{formatNumber(c.member_count)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
