'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { fetchAndCacheVotes, useSyncFeedVotes } from '@/lib/feedVoteCache';
import { topVocab, normalizeTag } from '@/lib/tagging';
import { useAuth } from '@/components/providers/AuthProvider';
import PostList from '@/components/post/PostList';
import type { PostData } from '@/components/post/PostCard';
import { LoadingSpinner, EmptyState } from '@/components/ui/Feedback';

export default function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { user } = useAuth();
  const [tag, setTag] = useState('');
  const [valid, setValid] = useState(true);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [related, setRelated] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const userRef = useRef(user);
  userRef.current = user;
  useSyncFeedVotes(posts, user?.id);

  useEffect(() => {
    let cancelled = false;
    params.then(p => {
      if (cancelled) return;
      const t = normalizeTag(decodeURIComponent(p.tag));
      if (!t) {
        setValid(false);
        setLoading(false);
        return;
      }
      setTag(t);
    });
    return () => { cancelled = true; };
  }, [params]);

  useEffect(() => {
    if (!tag) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('posts')
          .select('*, author:profiles!posts_author_id_fkey(username,display_name,avatar_url,role), community:communities!posts_community_id_fkey(id,name,slug,color,icon_url)')
          .eq('is_removed', false)
          .contains('tags', [tag])
          .order('upvotes', { ascending: false })
          .limit(30);
        if (error) throw error;
        if (cancelled) return;
        const mapped = ((data as any[]) || []).map((p: any) => ({
          ...p,
          author: p.author || { username: 'unknown' },
          community: p.community || undefined,
        }));
        const uid = userRef.current?.id;
        if (uid) fetchAndCacheVotes(supabase, uid, mapped.map((p: any) => p.id));
        setPosts(mapped);
        // Related tags: top co-occurring tags excluding this one
        setRelated(topVocab(mapped.map(p => p.tags).filter(Boolean), 12).filter(t => t !== tag).slice(0, 8));
      } catch {
        if (!cancelled) setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tag]);

  if (!valid) {
    return (
      <div className="px-4 py-8">
        <EmptyState title="Invalid tag" description="Tags use lowercase letters, numbers and hyphens." />
      </div>
    );
  }

  return (
    <div className="flex px-3 sm:px-4 py-3 gap-4 sm:gap-5 w-full">
      <main className="flex-1 min-w-0 w-full max-w-[960px]">
        <Link href="/search" className="inline-flex items-center gap-1 text-xs font-bold text-[var(--fg4)] hover:text-[var(--fg)] mb-3 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Explore
        </Link>

        <div className="post-card p-4 mb-3">
          <h1 className="text-xl font-bold text-[var(--fg)]">#{tag}</h1>
          <p className="text-xs text-[var(--fg4)] mt-1">
            {loading ? 'Loading posts…' : `${posts.length} post${posts.length === 1 ? '' : 's'} tagged`}
          </p>
          {related.length > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--fg4)] self-center mr-1">Related:</span>
              {related.map(t => (
                <Link
                  key={t}
                  href={`/tag/${encodeURIComponent(t)}`}
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-[var(--brand-500)] bg-[var(--brand-500)]/10 hover:bg-[var(--brand-500)]/20 transition-colors"
                >
                  #{t}
                </Link>
              ))}
            </div>
          )}
        </div>

        {loading && posts.length === 0 ? (
          <LoadingSpinner />
        ) : (
          <PostList posts={posts} emptyTitle={`No posts tagged #${tag} yet`} emptyDescription="Be the first to post about this topic!" />
        )}
        <div className="pb-20 lg:pb-8" />
      </main>
    </div>
  );
}
