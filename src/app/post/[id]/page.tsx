'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import CommentThread, { type CommentData } from '@/components/comments/CommentThread';
import CommentForm from '@/components/comments/CommentForm';
import Button from '@/components/ui/Button';
import { LoadingSpinner, EmptyState } from '@/components/ui/Feedback';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, Bookmark, MoreHorizontal, ArrowLeft } from 'lucide-react';
import { cn, formatDate, formatNumber } from '@/lib/utils';

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState('');
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [vote, setVote] = useState<'up' | 'down' | null>(null);

  useEffect(() => { params.then(p => setId(p.id)); }, [params]);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const supabase = createClient();
        const { data: postData } = await supabase
          .from('posts')
          .select('*, author:profiles!posts_author_id_fkey(username,display_name,avatar_url), community:communities!posts_community_id_fkey(name,slug,color)')
          .eq('id', id)
          .single();

        setPost(postData);

        const { data: commentData } = await supabase
          .from('comments')
          .select('*, author:profiles!comments_author_id_fkey(username,display_name,avatar_url)')
          .eq('post_id', id)
          .eq('is_removed', false)
          .order('created_at', { ascending: true });

        if (commentData) {
          // Build threaded structure
          const flat = commentData.map(c => ({ ...c, author: c.author || { username: 'unknown' }, children: [] as CommentData[] }));
          const map = new Map(flat.map(c => [c.id, c]));
          const roots: CommentData[] = [];
          for (const c of flat) {
            if (c.parent_id && map.has(c.parent_id)) {
              map.get(c.parent_id)!.children!.push(c);
            } else {
              roots.push(c);
            }
          }
          setComments(roots);
        }
      } catch {
        // not found
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="min-h-screen"><Header /><LoadingSpinner /></div>;

  if (!post) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <EmptyState title="Post not found" action={<Link href="/"><Button size="sm">Go home</Button></Link>} />
        </div>
      </div>
    );
  }

  const score = post.upvotes - post.downvotes + (vote === 'up' ? 1 : vote === 'down' ? -1 : 0);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Link
          href={post.community ? `/r/${post.community.slug}` : '/'}
          className="inline-flex items-center gap-1 text-sm text-[var(--fg4)] hover:text-[var(--fg)] mb-3 sm:mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to {post.community ? `r/${post.community.slug}` : 'home'}</span>
          <span className="sm:hidden">Back</span>
        </Link>

        <article className="anim-fade-up">
          <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-[11px] sm:text-xs text-[var(--fg4)] mb-2">
            {post.community && (
              <>
                <Link href={`/r/${post.community.slug}`} className="font-semibold text-[var(--fg)] hover:underline">r/{post.community.slug}</Link>
                <span>·</span>
              </>
            )}
            <span className="hidden sm:inline">Posted by</span>
            <Link href={`/profile/${post.author.username}`} className="hover:underline">u/{post.author.username}</Link>
            <span>·</span>
            <time>{formatDate(post.created_at)}</time>
          </div>

          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-[var(--fg)] leading-tight">{post.title}</h1>

          {post.body && (
            <div className="mt-3 sm:mt-4 text-sm sm:text-[15px] text-[var(--fg)] leading-relaxed whitespace-pre-wrap prose">{post.body}</div>
          )}

          {/* Vote bar */}
          <div className="flex items-center gap-1 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-0.5 bg-[var(--bg-raised)] rounded-[var(--r-full)] px-1">
              <button onClick={() => setVote(vote === 'up' ? null : 'up')} className={cn('p-1.5 rounded-full transition-color', vote === 'up' ? 'text-[var(--brand-600)]' : 'text-[var(--fg4)] hover:text-[var(--brand-600)]')}>
                <ArrowBigUp className="h-5 w-5" />
              </button>
              <span className={cn('text-xs sm:text-sm font-bold tabular-nums px-0.5', vote === 'up' && 'text-[var(--brand-600)]', vote === 'down' && 'text-red-500')}>
                {formatNumber(score)}
              </span>
              <button onClick={() => setVote(vote === 'down' ? null : 'down')} className={cn('p-1.5 rounded-full transition-color', vote === 'down' ? 'text-red-500' : 'text-[var(--fg4)] hover:text-red-500')}>
                <ArrowBigDown className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center gap-0.5 ml-1.5">
              <span className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium text-[var(--fg4)]">
                <MessageSquare className="h-4 w-4" /> {formatNumber(post.comment_count)}
              </span>
              <button className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-[var(--r-full)] text-xs font-medium text-[var(--fg4)] hover:bg-[var(--bg-raised)] transition-colors">
                <Share2 className="h-4 w-4" /> <span className="hidden sm:inline">Share</span>
              </button>
              <button className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-[var(--r-full)] text-xs font-medium text-[var(--fg4)] hover:bg-[var(--bg-raised)] transition-colors">
                <Bookmark className="h-4 w-4" /> <span className="hidden sm:inline">Save</span>
              </button>
            </div>
          </div>
        </article>

        <div className="mt-5 sm:mt-6 pb-20 lg:pb-8">
          <h2 className="text-sm font-semibold text-[var(--fg)] mb-3">Comments</h2>
          <div className="mb-5">
            <CommentForm onSubmit={(body) => console.log('Comment:', body)} />
          </div>
          <CommentThread comments={comments} />
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
