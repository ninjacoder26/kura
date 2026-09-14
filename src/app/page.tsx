'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import PostList from '@/components/post/PostList';
import type { PostData } from '@/components/post/PostCard';
import Link from 'next/link';
import { Sparkles, TrendingUp, Plus, Users } from 'lucide-react';

function FeedSkeleton() {
  return (
    <div className="space-2">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="post-card flex">
          <div className="flex flex-col items-center gap-1 px-1.5 py-2 bg-[var(--bg-raised)] rounded-l w-9">
            <div className="h-5 w-5 rounded skeleton" />
            <div className="h-3 w-5 rounded skeleton" />
            <div className="h-5 w-5 rounded skeleton" />
          </div>
          <div className="flex-1 p-2 space-y-1.5">
            <div className="h-2.5 w-28 rounded skeleton" />
            <div className="h-3.5 w-full rounded skeleton" />
            <div className="h-2.5 w-2/3 rounded skeleton" />
            <div className="flex gap-1.5 pt-0.5">
              <div className="h-5 w-16 rounded skeleton" />
              <div className="h-5 w-12 rounded skeleton" />
              <div className="h-5 w-12 rounded skeleton" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('posts')
          .select('*, author:profiles!posts_author_id_fkey(username,display_name,avatar_url), community:communities!posts_community_id_fkey(name,slug,color)')
          .eq('is_removed', false)
          .order('created_at', { ascending: false })
          .limit(20);

        if (data) {
          setPosts((data as any[]).map((p: any) => ({
            ...p,
            author: p.author || { username: 'unknown' },
            community: p.community || undefined,
          })));
        }
      } catch {
        // Supabase not configured
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex justify-center px-3 py-3 gap-4 max-w-[1400px] mx-auto">
        {/* Left sidebar */}
        <div className="hidden lg:block w-[var(--left-sidebar-w)] shrink-0">
          <div className="sticky top-[calc(var(--header-h)+12px)]">
            <Sidebar />
          </div>
        </div>

        {/* Main feed */}
        <main className="flex-1 min-w-0 max-w-[680px]">
          {/* Sort bar */}
          <div className="post-card flex items-center gap-1 px-2 py-1.5 mb-2.5">
            <button className="text-xs font-bold text-[var(--fg)] px-2.5 py-1 rounded hover:bg-[var(--surface-hover)]">Best</button>
            <button className="text-xs font-bold text-[var(--fg4)] px-2.5 py-1 rounded hover:bg-[var(--surface-hover)]">New</button>
            <button className="text-xs font-bold text-[var(--fg4)] px-2.5 py-1 rounded hover:bg-[var(--surface-hover)]">Top</button>
          </div>

          {/* Hero — only when empty */}
          {!loading && posts.length === 0 && (
            <div className="post-card p-4 mb-2.5 anim-fade-up">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-700)] flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-medium text-[var(--fg)]">Home</h2>
                  <p className="text-xs text-[var(--fg3)] mt-0.5">
                    Your personal Kura frontpage. Come here to check in with your favorite communities.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    <Link href="/communities">
                      <button className="reddit-btn bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] text-xs py-1.5 px-3">
                        <Users className="h-3 w-3" /> Browse
                      </button>
                    </Link>
                    <Link href="/submit">
                      <button className="reddit-btn border border-[var(--brand-600)] text-[var(--brand-600)] hover:bg-[var(--brand-50)] bg-transparent text-xs py-1.5 px-3">
                        <Plus className="h-3 w-3" /> Post
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feed */}
          {loading ? <FeedSkeleton /> : (
            <PostList
              posts={posts}
              emptyTitle="No posts in your feed"
              emptyDescription="Join some communities or create a post to get started."
            />
          )}
        </main>

        {/* Right sidebar */}
        <aside className="hidden xl:block w-[var(--right-sidebar-w)] shrink-0">
          <div className="sticky top-[calc(var(--header-h)+12px)] space-y-3">
            {/* Home widget */}
            <div className="sidebar-widget">
              <div className="bg-gradient-to-b from-[var(--brand-500)] to-[var(--brand-700)] h-6" />
              <div className="p-2.5">
                <div className="flex items-center gap-2 -mt-4 mb-1.5">
                  <div className="h-8 w-8 rounded-full bg-[var(--brand-600)] border-2 border-[var(--surface)] flex items-center justify-center">
                    <span className="text-white font-bold text-xs">K</span>
                  </div>
                </div>
                <p className="text-xs font-medium text-[var(--fg)]">Home</p>
                <p className="text-[11px] text-[var(--fg3)] mt-0.5 leading-relaxed">
                  Your personal Kura frontpage.
                </p>
                <div className="mt-2 space-y-1.5">
                  <Link href="/submit">
                    <button className="reddit-btn w-full bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] text-xs py-1.5">
                      Create Post
                    </button>
                  </Link>
                  <Link href="/communities">
                    <button className="reddit-btn w-full border border-[var(--brand-600)] text-[var(--brand-600)] hover:bg-[var(--brand-50)] bg-transparent text-xs py-1.5">
                      Create Community
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Popular Communities */}
            <div className="sidebar-widget">
              <div className="sidebar-widget-header">Popular Communities</div>
              <div className="p-1.5">
                {[
                  { name: 'kathmandu', members: '24.5k' },
                  { name: 'nepal', members: '89.2k' },
                  { name: 'technology', members: '12.8k' },
                  { name: 'gaming', members: '31.4k' },
                  { name: 'culture', members: '8.7k' },
                ].map((c, i) => (
                  <Link
                    key={c.name}
                    href={`/r/${c.name}`}
                    className="flex items-center gap-2 px-1.5 py-1 rounded text-sm text-[var(--fg2)] hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <span className="text-[11px] font-bold text-[var(--fg4)] w-4 text-right">{i + 1}</span>
                    <div className="h-5 w-5 rounded-full bg-gradient-to-br from-[var(--brand-400)] to-[var(--brand-700)] flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                      {c.name[0].toUpperCase()}
                    </div>
                    <span className="text-[11px] font-medium text-[var(--fg)] truncate flex-1">r/{c.name}</span>
                    <span className="text-[10px] text-[var(--fg4)]">{c.members}</span>
                  </Link>
                ))}
                <Link href="/communities" className="block px-1.5 py-1 text-[11px] font-bold text-[var(--brand-600)] hover:underline">
                  See more
                </Link>
              </div>
            </div>

            {/* Footer */}
            <div className="text-[10px] text-[var(--fg4)] space-y-0.5 px-0.5">
              <div className="flex flex-wrap gap-x-1.5 gap-y-0.5">
                <Link href="/" className="hover:underline">Home</Link>
                <Link href="/communities" className="hover:underline">About</Link>
                <Link href="/setup" className="hover:underline">Careers</Link>
                <Link href="/setup" className="hover:underline">Press</Link>
              </div>
              <div className="flex flex-wrap gap-x-1.5 gap-y-0.5">
                <Link href="/setup" className="hover:underline">Help</Link>
                <Link href="/setup" className="hover:underline">Blog</Link>
                <Link href="/setup" className="hover:underline">Terms</Link>
                <Link href="/setup" className="hover:underline">Privacy</Link>
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
