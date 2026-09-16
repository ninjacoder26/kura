'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import PostList from '@/components/post/PostList';
import type { PostData } from '@/components/post/PostCard';
import Link from 'next/link';
import { Sparkles, Plus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

type SortType = 'new' | 'top' | 'hot';

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="post-card flex">
          <div className="flex flex-col items-center gap-1 px-2 py-3 bg-[var(--bg-raised)] rounded-l w-10">
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

export default function HomePage() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [sort, setSort] = useState<SortType>('new');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => { setPage(0); setPosts([]); setHasMore(true); }, [sort]);

  useEffect(() => {
    async function load() {
      if (page === 0) setLoading(true);
      else setLoadingMore(true);
      try {
        const supabase = createClient();
        let query = supabase.from('posts').select('*, author:profiles!posts_author_id_fkey(username,display_name,avatar_url), community:communities!posts_community_id_fkey(name,slug,color)').eq('is_removed', false);

        if (sort === 'new') query = query.order('created_at', { ascending: false });
        else if (sort === 'top') query = query.order('upvotes', { ascending: false });
        else query = query.order('upvotes', { ascending: false }).order('downvotes', { ascending: true });

        query = query.range(page * 20, (page + 1) * 20 - 1);
        const { data, error: fetchErr } = await query;
        if (fetchErr) throw fetchErr;
        if (data) {
          const mapped = (data as any[]).map((p: any) => ({
            ...p,
            author: p.author || { username: 'unknown' },
            community: p.community || undefined,
          }));
          setPosts(prev => page === 0 ? mapped : [...prev, ...mapped]);
          setHasMore(data.length === 20);
        }
      } catch (err: any) { setError(err.message || 'Failed to load feed'); } finally { setLoading(false); setLoadingMore(false); }
    }
    load();
  }, [sort, page]);

  function handlePostDelete(id: string) {
    setPosts(prev => prev.filter(p => p.id !== id));
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex px-4 py-3 gap-5">
        <aside className="hidden lg:block w-[228px] shrink-0">
          <div className="sticky top-[60px]">
            <Sidebar />
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="post-card flex items-center gap-1 px-3 py-2 mb-3">
            {([['new', 'New'], ['hot', 'Hot'], ['top', 'Top']] as const).map(([key, label]) => (
              <button key={key} onClick={() => setSort(key)}
                className={cn('text-sm font-bold px-3 py-1.5 rounded-full hover:bg-[var(--surface-hover)] transition-colors', sort === key ? 'text-[var(--fg)]' : 'text-[var(--fg4)]')}>
                {label}
              </button>
            ))}
          </div>

          {!loading && posts.length === 0 && !error && (
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
                      <button className="kura-btn bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] text-sm py-2 px-5">
                        <Users className="h-4 w-4" /> Browse Communities
                      </button>
                    </Link>
                    <Link href="/k/create">
                      <button className="kura-btn border border-[var(--brand-600)] text-[var(--brand-600)] hover:bg-[var(--brand-50)] bg-transparent text-sm py-2 px-5">
                        <Plus className="h-4 w-4" /> Create Community
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="post-card p-5 mb-3 text-center">
              <p className="text-sm text-red-500">{error}</p>
              <button onClick={() => window.location.reload()} className="kura-btn mt-2 bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] text-xs">Retry</button>
            </div>
          )}

          {loading && page === 0 ? <FeedSkeleton /> : (
            <>
              <PostList posts={posts} emptyTitle="No posts in your feed" emptyDescription="Join some communities or create a post to get started." onDelete={handlePostDelete} />
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
          <div className="sticky top-[60px] space-y-4">
            <div className="sidebar-widget">
              <div className="bg-gradient-to-b from-[var(--brand-500)] to-[var(--brand-700)] h-8" />
              <div className="p-3">
                <div className="flex items-center gap-2 -mt-5 mb-2">
                  <div className="h-10 w-10 rounded-full bg-[var(--brand-600)] border-2 border-[var(--surface)] flex items-center justify-center">
                    <span className="text-white font-bold text-sm">K</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-[var(--fg)]">Home</p>
                <p className="text-xs text-[var(--fg3)] mt-1 leading-relaxed">Your personal Kura frontpage.</p>
                <div className="mt-3 space-y-2">
                  <Link href="/submit">
                    <button className="kura-btn w-full bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] text-sm py-2">Create Post</button>
                  </Link>
                  <Link href="/k/create">
                    <button className="kura-btn w-full border border-[var(--brand-600)] text-[var(--brand-600)] hover:bg-[var(--brand-50)] bg-transparent text-sm py-2">Create Community</button>
                  </Link>
                </div>
              </div>
            </div>

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
      <MobileNav />
    </div>
  );
}
