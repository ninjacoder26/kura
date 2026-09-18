'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchAndCacheVotes, useSyncFeedVotes } from '@/lib/feedVoteCache';
import { getTagAffinity, tagBoost } from '@/lib/tagAffinity';
import { getPageCache, setPageCache, hasPageCache, isCacheFresh } from '@/lib/pageCache';
import Sidebar from '@/components/layout/Sidebar';
import PostList from '@/components/post/PostList';
import type { PostData } from '@/components/post/PostCard';
import Link from 'next/link';
import { Sparkles, Plus, Users, TrendingUp, Shield, MessageCircle, ChevronRight } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { useAuth, useShowLoggedOutUI } from '@/components/providers/AuthProvider';
import { usePopularCommunities } from '@/lib/usePopularCommunities';
import { FEED_SORTS, TOP_RANGES, topRangeCutoff, risingCutoff, type FeedSort, type TopRange } from '@/lib/feedSort';
import Avatar from '@/components/ui/Avatar';

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="post-card flex">
          <div className="flex flex-col items-center gap-1 px-2 py-3 rounded-l w-10">
            <div className="h-6 w-6 rounded skeleton" />
            <div className="h-3 w-6 rounded skeleton" />
            <div className="h-6 w-6 rounded skeleton" />
          </div>
          <div className="flex-1 p-2 space-y-2">
            <div className="h-2.5 w-32 rounded skeleton" />
            <div className="h-4 w-full rounded skeleton" />
            <div className="h-3 w-2/3 rounded skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}

function HeroBanner() {
  return (
    <div className="post-card overflow-hidden mb-3">
      {/* Gradient banner */}
      <div className="h-20 sm:h-24 bg-gradient-to-r from-[var(--brand-600)] via-[var(--brand-500)] to-[var(--brand-400)] relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnYtMmgtNHY2aDJ2Mmgydi0yem0wLThoLTJ2MmgyVjI2ek0yNCAyNGgtMnYtMmgydjJ6bTAtNGgtMnYtMmgydjJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
      </div>
      <div className="px-4 pb-4 -mt-6 relative">
        <div className="flex items-end gap-3 mb-3">
          <div className="h-14 w-14 rounded-full bg-[var(--surface)] border-4 border-[var(--surface)] flex items-center justify-center shadow-md">
            <span className="text-[var(--brand-500)] font-bold text-xl">K</span>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[var(--fg)]">Kura</h1>
            <p className="text-xs text-[var(--fg4)]">Nepal&apos;s front page of the internet</p>
          </div>
        </div>
        <p className="text-sm text-[var(--fg3)] mb-4 max-w-lg">
          Kura is a network of communities where people can dive into their interests, hobbies and passions.
          There&apos;s a Kura for almost everything.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/signup">
            <button className="kura-btn bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)] text-sm py-2 px-6">
              Join Kura
            </button>
          </Link>
          <Link href="/communities">
            <button className="kura-btn border border-[var(--border)] text-[var(--fg2)] hover:border-[var(--border-strong)] bg-transparent text-sm py-2 px-6">
              Browse Communities
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function RuleCard() {
  const rules = [
    { icon: Shield, title: 'Be respectful', desc: 'Treat others with kindness' },
    { icon: MessageCircle, title: 'Stay on topic', desc: 'Keep discussions relevant' },
    { icon: TrendingUp, title: 'Share quality content', desc: 'Post original, valuable stuff' },
  ];

  return (
    <div className="post-card p-4 mb-3">
      <h3 className="text-sm font-bold text-[var(--fg)] mb-3">Kura Rules</h3>
      <div className="space-y-3">
        {rules.map((rule, i) => {
          const Icon = rule.icon;
          return (
            <div key={i} className="flex items-start gap-3">
              <div className="h-7 w-7 rounded-full bg-[var(--brand-50)] flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-[var(--brand-500)]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--fg)]">{rule.title}</p>
                <p className="text-[11px] text-[var(--fg4)]">{rule.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrendingCommunities() {
  const communities = usePopularCommunities(5);

  if (communities.length === 0) return null;

  return (
    <div className="post-card overflow-hidden mb-3">
      <div className="bg-gradient-to-r from-[var(--brand-600)] to-[var(--brand-500)] px-4 py-2.5">
        <h3 className="text-xs font-bold text-white uppercase tracking-wide">Popular Communities</h3>
      </div>
      <div className="p-2">
        {communities.map((c, i) => (
          <Link
            key={c.slug}
            href={`/k/${c.slug}`}
            className="flex items-center gap-3 px-2 py-2 rounded hover:bg-[var(--surface-hover)] transition-colors group"
          >
            <span className="text-xs font-bold text-[var(--fg4)] w-4 text-right">{i + 1}</span>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--brand-400)] to-[var(--brand-700)] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {c.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--fg)] group-hover:underline truncate">k/{c.slug}</p>
              {c.description && <p className="text-[11px] text-[var(--fg4)] truncate">{c.description}</p>}
            </div>
            <span className="text-[11px] text-[var(--fg4)] shrink-0">{formatNumber(c.member_count)} members</span>
          </Link>
        ))}
        <Link href="/communities" className="flex items-center justify-center gap-1 px-2 py-2 mt-1 text-xs font-bold text-[var(--brand-500)] hover:bg-[var(--surface-hover)] rounded transition-colors">
          View All <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  // Correct on the first frame (no hero pop-in after auth resolves)
  const showLoggedOutUI = useShowLoggedOutUI();
  const [sort, setSort] = useState<FeedSort>('hot');
  const [topRange, setTopRange] = useState<TopRange>('week');
  // Reranked per user (affinity differs), so the user is part of the key.
  const feedKey = `home:${sort}:${topRange}:${user?.id ?? 'anon'}`;
  // Seed from cache: revisits render instantly, revalidate happens below.
  const [posts, setPosts] = useState<PostData[]>(() => getPageCache<{ posts: PostData[] }>(feedKey)?.posts ?? []);
  const [loading, setLoading] = useState(() => !hasPageCache(feedKey));
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(() => getPageCache<{ hasMore: boolean }>(feedKey)?.hasMore ?? true);
  const [retryKey, setRetryKey] = useState(0);
  const userRef = useRef(user);
  userRef.current = user;
  const reqRef = useRef(0);
  useSyncFeedVotes(posts, user?.id);

  useEffect(() => { setPage(0); setHasMore(true); }, [sort, topRange]);

  useEffect(() => {
    // Fresh cache (<30s): skip the refetch entirely on revisit — zero backend load
    if (page === 0 && retryKey === 0 && isCacheFresh(feedKey)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    // Only page-0 loads race (sort/range changes); appends must never drop.
    const myReq = page === 0 ? ++reqRef.current : reqRef.current;
    async function load() {
      if (page === 0) setLoading(true);
      else setLoadingMore(true);
      try {
        const supabase = createClient();
        // Affinity loads in parallel with posts — never on the critical path
        const uid = userRef.current?.id;
        const affPromise: Promise<Map<string, number> | null> = uid
          ? getTagAffinity(supabase, uid)
          : Promise.resolve(null);
        let query = supabase.from('posts').select('*, author:profiles!posts_author_id_fkey(username,display_name,avatar_url,role), community:communities!posts_community_id_fkey(id,name,slug,color,icon_url)').eq('is_removed', false);

        if (sort === 'new') query = query.order('created_at', { ascending: false });
        else if (sort === 'top') {
          query = query.order('upvotes', { ascending: false });
          const cutoff = topRangeCutoff(topRange);
          if (cutoff) query = query.gte('created_at', cutoff);
        }
        else if (sort === 'rising') {
          query = query.gte('created_at', risingCutoff()).order('upvotes', { ascending: false });
        }
        else query = query.order('upvotes', { ascending: false }).order('downvotes', { ascending: true });

        query = query.range(page * 20, (page + 1) * 20 - 1);
        const [{ data, error: fetchErr }, aff] = await Promise.all([query, affPromise]);
        if (fetchErr) throw fetchErr;
        if (page === 0 && reqRef.current !== myReq) return;
        if (!cancelled && data) {
          const mapped = (data as any[]).map((p: any) => ({
            ...p,
            author: p.author || { username: 'unknown' },
            community: p.community || undefined,
          }));
          // Recommendation blend (soft, in-page only): familiar tags nudge up.
          // Skipped for New (recency stays strict) and logged-out users.
          let ranked = mapped;
          if (aff && sort !== 'new' && mapped.length > 1) {
            const scoreOf = (p: any) => p.upvotes + tagBoost(aff, p.tags) * 2;
            ranked = [...mapped].sort((a, b) => scoreOf(b) - scoreOf(a));
          }
          // Batch vote/save state in 2 queries (claims sync so cards mount warm)
          if (uid) fetchAndCacheVotes(supabase, uid, ranked.map(p => p.id));
          const more = data.length === 20;
          setPosts(prev => {
            const next = page === 0 ? ranked : [...prev, ...ranked];
            // Cache the accumulated feed so back-navigation is instant
            if (page === 0) setPageCache(feedKey, { posts: next, hasMore: more });
            else {
              const prevCached = getPageCache<{ posts: PostData[] }>(feedKey);
              if (prevCached) setPageCache(feedKey, { posts: [...prevCached.posts, ...ranked], hasMore: more });
            }
            return next;
          });
          setHasMore(more);
        }
      } catch (err: any) { if (!cancelled && (page !== 0 || reqRef.current === myReq)) setError(err.message || 'Failed to load feed'); } finally { if (!cancelled && (page !== 0 || reqRef.current === myReq)) { setLoading(false); setLoadingMore(false); } }
    }
    load();
    return () => { cancelled = true; };
  }, [sort, topRange, page, retryKey, feedKey]);

  function handlePostDelete(id: string) {
    setPosts(prev => {
      const next = prev.filter(p => p.id !== id);
      setPageCache(feedKey, { posts: next, hasMore });
      return next;
    });
  }

  function handleRetry() {
    setError('');
    setPage(0);
    setHasMore(true);
  }

  return (
    <>
      <div className="flex px-3 sm:px-4 py-3 gap-4 sm:gap-5 w-full max-w-[1460px] mx-auto">
        <aside className="hidden lg:block w-[272px] shrink-0">
          <div className="sticky top-12">
            <Sidebar />
          </div>
        </aside>

        <main className="flex-1 min-w-0 w-full max-w-[760px]">
          {/* Hero for logged-out users */}
          {showLoggedOutUI && <HeroBanner />}

          {/* Composer — Reddit-style quick create box */}
          {!authLoading && user && (
            <Link href="/submit" className="block mb-3">
              <div className="post-card flex items-center gap-3 p-2.5 hover:border-[var(--border-strong)] transition-colors">
                <Avatar src={user.avatar_url} name={user.display_name || user.username || 'you'} size="md" />
                <span className="flex-1 h-10 flex items-center px-4 rounded-full bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--fg4)] hover:border-[var(--brand-400)] transition-colors">
                  Create a post...
                </span>
              </div>
            </Link>
          )}

          {/* Sort tabs */}
          <div className="post-card flex items-center gap-1 px-3 py-2 mb-3 flex-wrap sticky top-12 z-20">
            {FEED_SORTS.map(({ key, label }) => (
              <button key={key} onClick={() => setSort(key)}
                className={cn('text-sm font-bold px-3 py-1.5 rounded-full hover:bg-[var(--surface-hover)] transition-colors', sort === key ? 'text-[var(--fg)]' : 'text-[var(--fg4)]')}>
                {label}
              </button>
            ))}
            {sort === 'top' && (
              <span className="flex items-center gap-1 ml-1 pl-2 border-l border-[var(--border)]">
                {TOP_RANGES.map(r => (
                  <button key={r.key} onClick={() => setTopRange(r.key)}
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

          {/* Empty state for logged-in users */}
          {!loading && posts.length === 0 && !error && user && (
            <div className="post-card p-5 mb-3 anim-fade-up">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-700)] flex items-center justify-center shrink-0">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-medium text-[var(--fg)]">Home</h2>
                  <p className="text-sm text-[var(--fg3)] mt-1">Your personal Kura frontpage. Come here to check in with your favorite communities.</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Link href="/communities">
                      <button className="kura-btn bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)] text-sm py-2 px-5">
                        <Users className="h-4 w-4" /> Browse Communities
                      </button>
                    </Link>
                    <Link href="/k/create">
                      <button className="kura-btn border border-[var(--brand-500)] text-[var(--brand-500)] hover:bg-[var(--brand-50)] bg-transparent text-sm py-2 px-5">
                        <Plus className="h-4 w-4" /> Create Community
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty state for logged-out users */}
          {showLoggedOutUI && !loading && posts.length === 0 && !error && (
            <div className="post-card p-5 mb-3 anim-fade-up text-center">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-700)] flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-lg font-medium text-[var(--fg)] mb-1">Your Kura Frontpage</h2>
              <p className="text-sm text-[var(--fg3)] mb-4 max-w-sm mx-auto">
                The best posts from your favorite communities will appear here. Join Kura to start customizing your frontpage.
              </p>
              <div className="flex justify-center gap-2">
                <Link href="/signup">
                  <button className="kura-btn bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)] text-sm py-2 px-6">
                    Join Kura
                  </button>
                </Link>
                <Link href="/login">
                  <button className="kura-btn border border-[var(--border)] text-[var(--fg2)] hover:border-[var(--border-strong)] bg-transparent text-sm py-2 px-6">
                    Log In
                  </button>
                </Link>
              </div>
            </div>
          )}

          {error && (
            <div className="post-card p-5 mb-3 text-center">
              <p className="text-sm text-red-500">{error}</p>
              <button onClick={handleRetry} className="kura-btn mt-2 bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)] text-xs">Retry</button>
            </div>
          )}

          {loading && posts.length === 0 ? <FeedSkeleton /> : (
            <>
              <PostList posts={posts} emptyTitle="No posts yet" emptyDescription="Be the first to post something!" onDelete={handlePostDelete} />
              {loadingMore && <div className="mt-3"><FeedSkeleton /></div>}
              {hasMore && posts.length > 0 && (
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

        <aside className="hidden xl:block w-[312px] shrink-0">
          <div className="sticky top-12 space-y-4">
            {/* Community card */}
            <div className="sidebar-widget">
              <div className="bg-gradient-to-b from-[var(--brand-500)] to-[var(--brand-700)] h-8" />
              <div className="p-3">
                <div className="flex items-center gap-2 -mt-5 mb-2">
                  <div className="h-10 w-10 rounded-full bg-[var(--brand-500)] border-2 border-[var(--surface)] flex items-center justify-center">
                    <span className="text-white font-bold text-sm">K</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-[var(--fg)]">Home</p>
                <p className="text-xs text-[var(--fg3)] mt-1 leading-relaxed">Your personal Kura frontpage. Come here to check in with your favorite communities.</p>
                <div className="mt-3 space-y-2">
                  <Link href="/submit">
                    <button className="kura-btn w-full bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)] text-sm py-2">Create Post</button>
                  </Link>
                  <Link href="/k/create">
                    <button className="kura-btn w-full border border-[var(--brand-500)] text-[var(--brand-500)] hover:bg-[var(--brand-50)] bg-transparent text-sm py-2">Create Community</button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Trending communities - visible to all */}
            <TrendingCommunities />

            {/* Rules - only for logged-out */}
            {showLoggedOutUI && <RuleCard />}

            {/* Footer links */}
            <div className="text-[11px] text-[var(--fg4)] space-y-1 px-1">
              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                <Link href="/" className="hover:underline">Home</Link>
                <Link href="/communities" className="hover:underline">About</Link>
                <Link href="/terms" className="hover:underline">Terms</Link>
                <Link href="/privacy" className="hover:underline">Privacy</Link>
              </div>
              <p>Kura Inc. 2026. All rights reserved.</p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
