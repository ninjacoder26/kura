'use client';

import Link from 'next/link';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { useState } from 'react';

interface PostCardProps {
  post: {
    id: string;
    title: string;
    body?: string;
    type?: string;
    author: {
      username: string;
      display_name?: string;
      avatar_url?: string;
    };
    community?: {
      name: string;
      slug: string;
      color?: string;
    };
    upvotes: number;
    downvotes: number;
    comment_count: number;
    created_at: string;
  };
  compact?: boolean;
}

export default function PostCard({ post, compact = false }: PostCardProps) {
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const score = post.upvotes - post.downvotes + (vote === 'up' ? 1 : vote === 'down' ? -1 : 0);

  return (
    <article className="group border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-hover)] transition-colors duration-150">
      <div className="flex">
        {/* Vote column */}
        <div className="flex flex-col items-center gap-0.5 px-2 py-3 sm:px-3">
          <button
            onClick={() => setVote(vote === 'up' ? null : 'up')}
            className={cn(
              'p-0.5 rounded-[var(--radius-sm)] transition-colors',
              vote === 'up'
                ? 'text-[var(--color-brand-600)] bg-[var(--color-brand-50)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-brand-600)] hover:bg-[var(--color-bg-tertiary)]'
            )}
            aria-label="Upvote"
          >
            <ArrowBigUp className="h-6 w-6" />
          </button>
          <span className={cn(
            'text-xs font-bold tabular-nums',
            vote === 'up' && 'text-[var(--color-brand-600)]',
            vote === 'down' && 'text-red-500',
            !vote && 'text-[var(--color-text)]'
          )}>
            {formatNumber(score)}
          </span>
          <button
            onClick={() => setVote(vote === 'down' ? null : 'down')}
            className={cn(
              'p-0.5 rounded-[var(--radius-sm)] transition-colors',
              vote === 'down'
                ? 'text-red-500 bg-red-50'
                : 'text-[var(--color-text-muted)] hover:text-red-500 hover:bg-[var(--color-bg-tertiary)]'
            )}
            aria-label="Downvote"
          >
            <ArrowBigDown className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 py-2 pr-3 min-w-0">
          {/* Meta */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mb-1">
            {post.community && (
              <>
                <Link
                  href={`/r/${post.community.slug}`}
                  className="font-semibold text-[var(--color-text)] hover:underline"
                >
                  r/{post.community.slug}
                </Link>
                <span>·</span>
              </>
            )}
            <span>Posted by</span>
            <Link
              href={`/profile/${post.author.username}`}
              className="hover:underline"
            >
              u/{post.author.username}
            </Link>
            <span>·</span>
            <time>{formatDate(post.created_at)}</time>
          </div>

          {/* Title */}
          <Link href={`/post/${post.id}`} className="block group/title">
            <h3 className="text-base font-semibold text-[var(--color-text)] group-hover/title:text-[var(--color-brand-600)] transition-colors leading-snug">
              {post.title}
            </h3>
          </Link>

          {/* Body preview */}
          {!compact && post.body && (
            <p className="mt-1.5 text-sm text-[var(--color-text-secondary)] line-clamp-3 leading-relaxed">
              {post.body}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 mt-2 -ml-1">
            <Link
              href={`/post/${post.id}`}
              className="flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-sm)] text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text)] transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              <span>{formatNumber(post.comment_count)} comments</span>
            </Link>
            <button className="flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-sm)] text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text)] transition-colors">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button className="flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-sm)] text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text)] transition-colors">
              <Bookmark className="h-4 w-4" />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button className="p-1 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text)] transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
