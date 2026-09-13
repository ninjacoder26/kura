'use client';

import Link from 'next/link';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';
import { useState } from 'react';

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
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const score = post.upvotes - post.downvotes + (vote === 'up' ? 1 : vote === 'down' ? -1 : 0);

  return (
    <article className="group border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-hover)] transition-colors">
      <div className="flex">
        {/* Vote — hidden on tiny screens, shown on sm+ */}
        <div className="hidden sm:flex flex-col items-center gap-0.5 px-2 py-3">
          <button
            onClick={() => setVote(vote === 'up' ? null : 'up')}
            className={cn(
              'p-0.5 rounded-[var(--r-xs)] transition-color',
              vote === 'up' ? 'text-[var(--brand-600)]' : 'text-[var(--fg4)] hover:text-[var(--brand-600)]'
            )}
            aria-label="Upvote"
          >
            <ArrowBigUp className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <span className={cn(
            'text-xs font-bold tabular-nums',
            vote === 'up' && 'text-[var(--brand-600)]',
            vote === 'down' && 'text-red-500',
          )}>
            {formatNumber(score)}
          </span>
          <button
            onClick={() => setVote(vote === 'down' ? null : 'down')}
            className={cn(
              'p-0.5 rounded-[var(--r-xs)] transition-color',
              vote === 'down' ? 'text-red-500' : 'text-[var(--fg4)] hover:text-red-500'
            )}
            aria-label="Downvote"
          >
            <ArrowBigDown className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 py-2.5 pr-3 min-w-0">
          {/* Meta */}
          <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-[11px] sm:text-xs text-[var(--fg4)] mb-1">
            {showCommunity && post.community && (
              <>
                <Link href={`/r/${post.community.slug}`} className="font-semibold text-[var(--fg)] hover:underline">
                  r/{post.community.slug}
                </Link>
                <span className="hidden sm:inline">·</span>
              </>
            )}
            <span className="hidden sm:inline">Posted by</span>
            <Link href={`/profile/${post.author.username}`} className="hover:underline">
              u/{post.author.username}
            </Link>
            <span>·</span>
            <time>{formatDate(post.created_at)}</time>
          </div>

          {/* Title */}
          <Link href={`/post/${post.id}`} className="block group/title">
            <h3 className="text-[15px] sm:text-base font-semibold text-[var(--fg)] group-hover/title:text-[var(--brand-600)] transition-colors leading-snug">
              {post.title}
            </h3>
          </Link>

          {/* Body preview */}
          {post.body && (
            <p className="mt-1.5 text-sm text-[var(--fg2)] line-clamp-2 sm:line-clamp-3 leading-relaxed">
              {post.body}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-0.5 mt-2 -ml-1 flex-wrap">
            {/* Mobile vote — inline on small screens */}
            <div className="flex sm:hidden items-center gap-0.5 mr-1">
              <button
                onClick={() => setVote(vote === 'up' ? null : 'up')}
                className={cn('p-1 rounded transition-color', vote === 'up' ? 'text-[var(--brand-600)]' : 'text-[var(--fg4)]')}
              >
                <ArrowBigUp className="h-5 w-5" />
              </button>
              <span className={cn('text-xs font-bold tabular-nums min-w-[16px] text-center', vote === 'up' && 'text-[var(--brand-600)]', vote === 'down' && 'text-red-500')}>
                {formatNumber(score)}
              </span>
              <button
                onClick={() => setVote(vote === 'down' ? null : 'down')}
                className={cn('p-1 rounded transition-color', vote === 'down' ? 'text-red-500' : 'text-[var(--fg4)]')}
              >
                <ArrowBigDown className="h-5 w-5" />
              </button>
            </div>

            <Link
              href={`/post/${post.id}`}
              className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 rounded-[var(--r-sm)] text-xs font-medium text-[var(--fg4)] hover:bg-[var(--bg-raised)] hover:text-[var(--fg)] transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              <span>{formatNumber(post.comment_count)}</span>
              <span className="hidden sm:inline">comments</span>
            </Link>
            <button className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 rounded-[var(--r-sm)] text-xs font-medium text-[var(--fg4)] hover:bg-[var(--bg-raised)] hover:text-[var(--fg)] transition-colors">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 rounded-[var(--r-sm)] text-xs font-medium text-[var(--fg4)] hover:bg-[var(--bg-raised)] hover:text-[var(--fg)] transition-colors">
              <Bookmark className="h-4 w-4" />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button className="p-1.5 rounded-[var(--r-sm)] text-[var(--fg4)] hover:bg-[var(--bg-raised)] transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
