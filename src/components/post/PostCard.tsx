'use client';

import Link from 'next/link';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import { useState } from 'react';
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
  author: PostAuthor;
  community?: PostCommunity;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  created_at: string;
}

interface PostCardProps {
  post: PostData;
  showCommunity?: boolean;
}

export default function PostCard({ post, showCommunity = true }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const [optimisticScore, setOptimisticScore] = useState(post.upvotes - post.downvotes);
  const score = optimisticScore + (vote === 'up' ? 1 : vote === 'down' ? -1 : 0);

  async function handleVote(value: 'up' | 'down') {
    if (!user) { toast('info', 'Log in to vote'); return; }
    const newValue = vote === value ? null : value;
    const oldScore = optimisticScore;
    // Optimistic update
    setVote(newValue);
    if (newValue) {
      setOptimisticScore(post.upvotes - post.downvotes + (newValue === 'up' ? 1 : -1));
    } else {
      setOptimisticScore(post.upvotes - post.downvotes);
    }
    // Server update
    const supabase = createClient();
    if (newValue) {
      await supabase.from('votes').upsert({ user_id: user.id, post_id: post.id, value: newValue === 'up' ? 1 : -1 });
    } else {
      await supabase.from('votes').delete().eq('user_id', user.id).eq('post_id', post.id);
    }
  }

  return (
    <div className="post-card flex">
      {/* Vote sidebar */}
      <div className="flex flex-col items-center gap-0.5 px-1 py-1.5 bg-[var(--bg-raised)] rounded-l w-9">
        <button onClick={() => handleVote('up')} className={cn('vote-btn', vote === 'up' && 'upvoted')} aria-label="Upvote">
          <ArrowBigUp className="h-5 w-5" fill={vote === 'up' ? 'currentColor' : 'none'} />
        </button>
        <span className={cn('text-[11px] font-bold tabular-nums leading-none', vote === 'up' && 'text-[#ff4500]', vote === 'down' && 'text-[#7193ff]')}>
          {formatNumber(score)}
        </span>
        <button onClick={() => handleVote('down')} className={cn('vote-btn', vote === 'down' && 'downvoted')} aria-label="Downvote">
          <ArrowBigDown className="h-5 w-5" fill={vote === 'down' ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 p-1.5">
        {/* Meta line */}
        <div className="flex items-center flex-wrap gap-x-1 text-[11px] text-[var(--fg4)]">
          {showCommunity && post.community && (
            <>
              <Link href={`/r/${post.community.slug}`} className="font-bold text-[var(--fg)] hover:underline">r/{post.community.slug}</Link>
              <span>·</span>
            </>
          )}
          <span>Posted by</span>
          <Link href={`/profile/${post.author.username}`} className="hover:underline">u/{post.author.username}</Link>
          <span>·</span>
          <time>{formatDate(post.created_at)}</time>
        </div>

        {/* Title */}
        <Link href={`/post/${post.id}`} className="block group/title mt-0.5">
          <h3 className="text-[15px] font-medium text-[var(--fg)] group-hover/title:underline leading-snug">{post.title}</h3>
        </Link>

        {/* Body preview */}
        {post.body && (
          <div className="mt-0.5 text-[13px] text-[var(--fg3)] line-clamp-2 leading-relaxed">
            {post.body}
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-0.5 mt-1 -ml-0.5">
          <Link href={`/post/${post.id}`} className="flex items-center gap-1 px-1.5 py-1 rounded text-[11px] font-bold text-[var(--fg4)] hover:bg-[var(--surface-hover)] transition-colors">
            <MessageSquare className="h-4 w-4" />
            {formatNumber(post.comment_count)} Comments
          </Link>
          <button className="flex items-center gap-1 px-1.5 py-1 rounded text-[11px] font-bold text-[var(--fg4)] hover:bg-[var(--surface-hover)] transition-colors">
            <Share2 className="h-4 w-4" /> Share
          </button>
          <button className="flex items-center gap-1 px-1.5 py-1 rounded text-[11px] font-bold text-[var(--fg4)] hover:bg-[var(--surface-hover)] transition-colors">
            <Bookmark className="h-4 w-4" /> Save
          </button>
          <button className="flex items-center gap-1 px-1.5 py-1 rounded text-[11px] font-bold text-[var(--fg4)] hover:bg-[var(--surface-hover)] transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
