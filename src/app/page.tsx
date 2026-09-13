'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import PostList from '@/components/post/PostList';
import type { PostData } from '@/components/post/PostCard';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { TrendingUp, Sparkles, Plus, Users, ArrowRight } from 'lucide-react';

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
          setPosts(data.map(p => ({
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 flex gap-5 lg:gap-6">
        <Sidebar />

        <main className="flex-1 min-w-0 space-y-4 sm:space-y-6">
          {/* Hero — only when empty */}
          {!loading && posts.length === 0 && (
            <div className="rounded-[var(--r-xl)] bg-gradient-to-br from-[var(--brand-600)] to-[var(--brand-800)] text-white overflow-hidden relative anim-fade-up">
              <div className="absolute inset-0 opacity-[0.07]">
                <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white" />
              </div>
              <div className="relative p-5 sm:p-8">
                <h1 className="text-xl sm:text-2xl font-bold">Kura — Nepal, talking.</h1>
                <p className="text-sm sm:text-base text-white/75 mt-1.5 max-w-lg leading-relaxed">
                  A community platform for Nepal. Share ideas, discover communities, connect with people across the country.
                </p>
                <div className="flex flex-wrap gap-3 mt-5">
                  <Link href="/communities">
                    <Button className="bg-white text-[var(--brand-700)] hover:bg-white/90 gap-1.5">
                      <Users className="h-4 w-4" /> Browse Communities
                    </Button>
                  </Link>
                  <Link href="/submit">
                    <Button className="bg-white/10 text-white border border-white/20 hover:bg-white/20 gap-1.5">
                      <Plus className="h-4 w-4" /> Create Post
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Feed */}
          <PostList
            posts={posts}
            emptyTitle="No posts in your feed"
            emptyDescription="Join some communities or create a post to get started."
          />
        </main>

        {/* Right sidebar — hidden on small screens */}
        <aside className="hidden xl:block w-64 2xl:w-72 shrink-0">
          <div className="sticky top-[72px] space-y-4 pb-8">
            <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
              <h3 className="font-semibold text-sm text-[var(--fg)] mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[var(--brand-500)]" />
                Getting started
              </h3>
              <div className="space-y-2.5">
                <Link href="/communities" className="flex items-center gap-2 text-sm text-[var(--fg2)] hover:text-[var(--brand-600)] transition-colors">
                  <Users className="h-4 w-4" /> Browse communities
                </Link>
                <Link href="/submit" className="flex items-center gap-2 text-sm text-[var(--fg2)] hover:text-[var(--brand-600)] transition-colors">
                  <Sparkles className="h-4 w-4" /> Create your first post
                </Link>
                <Link href="/search" className="flex items-center gap-2 text-sm text-[var(--fg2)] hover:text-[var(--brand-600)] transition-colors">
                  <TrendingUp className="h-4 w-4" /> Explore topics
                </Link>
              </div>
            </div>

            <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--bg-alt)] p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-[var(--r-xs)] bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-700)] flex items-center justify-center">
                  <span className="text-white font-bold text-[10px]">K</span>
                </div>
                <span className="font-semibold text-sm">About Kura</span>
              </div>
              <p className="text-xs text-[var(--fg3)] leading-relaxed">
                A community platform built for Nepal. Open source, community driven.
              </p>
              <Link href="/setup" className="inline-flex items-center gap-1 mt-2 text-xs text-[var(--brand-600)] hover:underline">
                System status <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </aside>
      </div>
      <MobileNav />
    </div>
  );
}
