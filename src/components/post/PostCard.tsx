'use client';

import Link from 'next/link';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, Bookmark, BookmarkCheck, Trash2, Pencil } from 'lucide-react';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { createClient } from '@/lib/supabase/client';

interface PostAuthor {
  username: string;
  display_name?: string;
  avatar_url?: string;
}

interface PostCommunity {
  name: string;
  slug: string;
  color?: string;
}

export interface PostData {
  id: string;
  title: string;
  body?: string;
  type?: string;
  url?: string;
  image_url?: string;
  author: PostAuthor;
  author_id?: string;
  community?: PostCommunity;
  community_id?: string;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  is_pinned?: boolean;
  is_locked?: boolean;
  created_at: string;
}

interface PostCardProps {
  post: PostData;
  showCommunity?: boolean;
  onDelete?: (id: string) => void;
}

export default function PostCard({ post, showCommunity = true, onDelete }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const [score, setScore] = useState(post.upvotes - post.downvotes);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase.from('votes').select('value').eq('user_id', user.id).eq('post_id', post.id).single().then((res: any) => {
      if (res.data) setVote(res.data.value === 1 ? 'up' : 'down');
    });
    supabase.from('saved_posts').select('id').eq('user_id', user.id).eq('post_id', post.id).single().then((res: any) => {
      if (res.data) setSaved(true);
    });
  }, [user, post.id]);

  async function handleVote(value: 'up' | 'down') {
    if (!user) { toast('info', 'Log in to vote'); return; }
    const oldValue = vote;
    const newValue = vote === value ? null : value;

    setVote(newValue);
    let delta = 0;
    if (oldValue === 'up') delta -= 1;
    else if (oldValue === 'down') delta += 1;
    if (newValue === 'up') delta += 1;
    else if (newValue === 'down') delta -= 1;
    setScore(score + delta);

    const supabase = createClient();
    if (newValue) {
      await supabase.from('votes').upsert({ user_id: user.id, post_id: post.id, value: newValue === 'up' ? 1 : -1 });
    } else {
      await supabase.from('votes').delete().eq('user_id', user.id).eq('post_id', post.id);
    }
  }

  async function handleSave() {
    if (!user) { toast('info', 'Log in to save posts'); return; }
    const supabase = createClient();
    if (saved) {
      await supabase.from('saved_posts').delete().eq('user_id', user.id).eq('post_id', post.id);
      setSaved(false);
      toast('success', 'Post unsaved');
    } else {
      await supabase.from('saved_posts').insert({ user_id: user.id, post_id: post.id });
      setSaved(true);
      toast('success', 'Post saved');
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this post?')) return;
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('posts').update({ is_removed: true }).eq('id', post.id);
      if (error) throw error;
      toast('success', 'Post deleted');
      onDelete?.(post.id);
    } catch (err: any) { toast('error', err.message || 'Failed to delete'); } finally { setDeleting(false); }
  }

  function handleShare() {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      navigator.share({ title: post.title, url });
    } else {
      navigator.clipboard.writeText(url);
      toast('success', 'Link copied to clipboard');
    }
  }

  return (
    <div className="post-card flex">
      {/* Vote column */}
      <div className="flex flex-col items-center gap-0.5 px-2 py-2 bg-[var(--bg-raised)] rounded-l w-10">
        <button onClick={() => handleVote('up')} className={cn('vote-btn', vote === 'up' && 'upvoted')} aria-label="Upvote">
          <ArrowBigUp className="h-6 w-6" fill={vote === 'up' ? 'currentColor' : 'none'} />
        </button>
        <span className={cn('text-xs font-bold tabular-nums leading-none', vote === 'up' && 'text-[var(--brand-600)]', vote === 'down' && 'text-[#003893]')}>
          {formatNumber(score)}
        </span>
        <button onClick={() => handleVote('down')} className={cn('vote-btn', vote === 'down' && 'downvoted')} aria-label="Downvote">
          <ArrowBigDown className="h-6 w-6" fill={vote === 'down' ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 p-2">
        {/* Meta line */}
        <div className="flex items-center flex-wrap gap-x-1 text-[12px] text-[var(--fg4)]">
          {post.is_pinned && <span className="text-emerald-600 font-bold">Pinned</span>}
          {showCommunity && post.community && (
            <>
              <Link href={`/k/${post.community.slug}`} className="font-bold text-[var(--fg)] hover:underline">k/{post.community.slug}</Link>
              <span>·</span>
            </>
          )}
          <span>by</span>
          <Link href={`/profile/${post.author.username}`} className="hover:underline">@{post.author.username}</Link>
          <span>·</span>
          <time>{formatDate(post.created_at)}</time>
        </div>

        {/* Title */}
        <Link href={`/post/${post.id}`} className="block group/title mt-1">
          <h3 className="text-lg font-medium text-[var(--fg)] group-hover/title:underline leading-snug">{post.title}</h3>
        </Link>

        {/* Link preview */}
        {post.type === 'link' && post.url && (
          <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--brand-600)] hover:underline break-all">{post.url}</a>
        )}

        {/* Image preview */}
        {post.type === 'image' && post.image_url && (
          <div className="mt-2">
            <img src={post.image_url} alt={post.title} className="max-h-[512px] rounded object-contain" />
          </div>
        )}

        {/* Body preview */}
        {post.body && (
          <div className="mt-1 text-[13px] text-[var(--fg3)] line-clamp-3 leading-relaxed">
            {post.body}
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-1 mt-2 -ml-1">
          <Link href={`/post/${post.id}`} className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-bold text-[var(--fg4)] hover:bg-[var(--surface-hover)] transition-colors">
            <MessageSquare className="h-5 w-5" />
            {formatNumber(post.comment_count)} Comments
          </Link>
          <button onClick={handleShare} className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-bold text-[var(--fg4)] hover:bg-[var(--surface-hover)] transition-colors">
            <Share2 className="h-5 w-5" /> Share
          </button>
          <button onClick={handleSave} className={cn('flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-bold hover:bg-[var(--surface-hover)] transition-colors', saved ? 'text-[var(--brand-600)]' : 'text-[var(--fg4)]')}>
            {saved ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />} {saved ? 'Saved' : 'Save'}
          </button>
          {user && user.id === post.author_id && (
            <>
              <Link href={`/post/${post.id}/edit`} className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-bold text-[var(--fg4)] hover:bg-[var(--surface-hover)] transition-colors">
                <Pencil className="h-5 w-5" /> Edit
              </Link>
              <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <Trash2 className="h-5 w-5" /> Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
