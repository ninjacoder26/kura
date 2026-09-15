'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import CommentThread, { type CommentData } from '@/components/comments/CommentThread';
import CommentForm from '@/components/comments/CommentForm';
import { LoadingSpinner, EmptyState } from '@/components/ui/Feedback';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, Bookmark, ArrowLeft, MoreHorizontal } from 'lucide-react';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [id, setId] = useState('');
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const [optimisticScore, setOptimisticScore] = useState(0);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => { params.then(p => setId(p.id)); }, [params]);

  const loadPost = useCallback(async () => {
    if (!id) return;
    try {
      const supabase = createClient();
      const { data: postData } = await supabase.from('posts').select('*, author:profiles!posts_author_id_fkey(username,display_name,avatar_url), community:communities!posts_community_id_fkey(name,slug,color)').eq('id', id).single();
      setPost(postData);
      if (postData) setOptimisticScore(postData.upvotes - postData.downvotes);
      if (user && postData) {
        const { data: voteData } = await supabase.from('votes').select('value').eq('user_id', user.id).eq('post_id', id).single();
        if (voteData) setVote(voteData.value === 1 ? 'up' : 'down');
      }
      const { data: commentData } = await supabase.from('comments').select('*, author:profiles!comments_author_id_fkey(username,display_name,avatar_url)').eq('post_id', id).eq('is_removed', false).order('created_at', { ascending: true });
      if (commentData) {
        const flat = (commentData as any[]).map((c: any) => ({ ...c, author: c.author || { username: 'unknown' }, children: [] as CommentData[] }));
        const map = new Map(flat.map((c: any) => [c.id, c]));
        const roots: CommentData[] = [];
        for (const c of flat) { if (c.parent_id && map.has(c.parent_id)) { map.get(c.parent_id)!.children!.push(c); } else { roots.push(c); } }
        setComments(roots);
      }
    } catch {} finally { setLoading(false); }
  }, [id, user]);

  useEffect(() => { loadPost(); }, [loadPost]);

  async function handleVote(value: 'up' | 'down') {
    if (!user) { toast('info', 'Log in to vote'); return; }
    const newValue = vote === value ? null : value;
    setVote(newValue);
    setOptimisticScore(newValue ? post.upvotes - post.downvotes + (newValue === 'up' ? 1 : -1) : post.upvotes - post.downvotes);
    const supabase = createClient();
    if (newValue) { await supabase.from('votes').upsert({ user_id: user.id, post_id: id, value: newValue === 'up' ? 1 : -1 }); }
    else { await supabase.from('votes').delete().eq('user_id', user.id).eq('post_id', id); }
  }

  async function handleComment(body: string) {
    if (!user) { toast('info', 'Log in to comment'); return; }
    setSubmittingComment(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('comments').insert({ body, author_id: user.id, post_id: id });
      if (error) throw error;
      toast('success', 'Comment added');
      await loadPost();
    } catch (err: any) { toast('error', err.message || 'Failed to add comment'); } finally { setSubmittingComment(false); }
  }

  if (loading) return <div className="min-h-screen"><Header /><LoadingSpinner /></div>;
  if (!post) return <div className="min-h-screen"><Header /><div className="px-4 py-8"><EmptyState title="Post not found" action={<Link href="/" className="reddit-btn bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] text-sm">Go home</Link>} /></div></div>;

  const score = optimisticScore + (vote === 'up' ? 1 : vote === 'down' ? -1 : 0);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="px-4 py-3 max-w-[740px] mx-auto">
        <Link href={post.community ? `/r/${post.community.slug}` : '/'} className="inline-flex items-center gap-1 text-xs font-bold text-[var(--fg4)] hover:text-[var(--fg)] mb-3 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to r/{post.community?.slug || 'home'}
        </Link>

        <article className="post-card flex">
          <div className="flex flex-col items-center gap-0.5 px-2 py-3 bg-[var(--bg-raised)] rounded-l w-10">
            <button onClick={() => handleVote('up')} className={cn('vote-btn', vote === 'up' && 'upvoted')}><ArrowBigUp className="h-6 w-6" fill={vote === 'up' ? 'currentColor' : 'none'} /></button>
            <span className={cn('text-xs font-bold tabular-nums leading-none', vote === 'up' && 'text-[#ff4500]', vote === 'down' && 'text-[#7193ff]')}>{formatNumber(score)}</span>
            <button onClick={() => handleVote('down')} className={cn('vote-btn', vote === 'down' && 'downvoted')}><ArrowBigDown className="h-6 w-6" fill={vote === 'down' ? 'currentColor' : 'none'} /></button>
          </div>
          <div className="flex-1 min-w-0 p-3">
            <div className="flex items-center flex-wrap gap-x-1 text-xs text-[var(--fg4)]">
              {post.community && <><Link href={`/r/${post.community.slug}`} className="font-bold text-[var(--fg)] hover:underline">r/{post.community.slug}</Link><span>·</span></>}
              <span>Posted by</span> <Link href={`/profile/${post.author.username}`} className="hover:underline">u/{post.author.username}</Link><span>·</span><time>{formatDate(post.created_at)}</time>
            </div>
            <h1 className="text-xl font-medium text-[var(--fg)] leading-snug mt-2">{post.title}</h1>
            {post.body && <div className="mt-3 text-sm text-[var(--fg2)] leading-relaxed whitespace-pre-wrap">{post.body}</div>}
            <div className="flex items-center gap-1 mt-3 -ml-1">
              <span className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-bold text-[var(--fg4)]"><MessageSquare className="h-5 w-5" /> {formatNumber(post.comment_count)} Comments</span>
              <button className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-bold text-[var(--fg4)] hover:bg-[var(--surface-hover)] transition-colors"><Share2 className="h-5 w-5" /> Share</button>
              <button className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-bold text-[var(--fg4)] hover:bg-[var(--surface-hover)] transition-colors"><Bookmark className="h-5 w-5" /> Save</button>
              <button className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-bold text-[var(--fg4)] hover:bg-[var(--surface-hover)] transition-colors"><MoreHorizontal className="h-5 w-5" /></button>
            </div>
          </div>
        </article>

        <div className="mt-3 mb-4">
          {user ? (
            <div className="post-card p-3">
              <p className="text-xs text-[var(--fg4)] mb-2">Comment as <span className="text-[var(--brand-600)] font-bold">{user.username}</span></p>
              <CommentForm onSubmit={handleComment} loading={submittingComment} />
            </div>
          ) : (
            <div className="post-card p-4 text-center">
              <p className="text-sm text-[var(--fg3)]"><Link href="/login" className="text-[var(--brand-600)] font-bold hover:underline">Log in</Link> or <Link href="/signup" className="text-[var(--brand-600)] font-bold hover:underline">sign up</Link> to leave a comment</p>
            </div>
          )}
        </div>

        <div className="pb-20 lg:pb-8"><CommentThread comments={comments} /></div>
      </div>
      <MobileNav />
    </div>
  );
}
