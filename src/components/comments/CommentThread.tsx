'use client';

import Link from 'next/link';
import { ArrowBigUp, ArrowBigDown, Reply, MoreHorizontal, Flag } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';
import { useState } from 'react';

interface Comment {
  id: string;
  body: string;
  author: {
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  upvotes: number;
  downvotes: number;
  depth: number;
  created_at: string;
  children?: Comment[];
}

interface CommentThreadProps {
  comments: Comment[];
  postId: string;
}

function CommentItem({ comment, postId }: { comment: Comment; postId: string }) {
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const [showReply, setShowReply] = useState(false);
  const score = comment.upvotes - comment.downvotes + (vote === 'up' ? 1 : vote === 'down' ? -1 : 0);

  return (
    <div
      className="animate-fade-in"
      style={{ marginLeft: comment.depth > 0 ? `${Math.min(comment.depth * 20, 80)}px` : 0 }}
    >
      <div className="group py-2">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <Avatar
            name={comment.author.display_name || comment.author.username}
            src={comment.author.avatar_url}
            size="xs"
          />
          <Link
            href={`/profile/${comment.author.username}`}
            className="text-xs font-semibold text-[var(--color-text)] hover:underline"
          >
            {comment.author.username}
          </Link>
          <span className="text-xs text-[var(--color-text-muted)]">·</span>
          <time className="text-xs text-[var(--color-text-muted)]">
            {formatDate(comment.created_at)}
          </time>
        </div>

        {/* Body */}
        <p className="text-sm text-[var(--color-text)] leading-relaxed pl-7">
          {comment.body}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-0.5 pl-5 mt-1">
          <button
            onClick={() => setVote(vote === 'up' ? null : 'up')}
            className={cn(
              'p-1 rounded transition-colors',
              vote === 'up'
                ? 'text-[var(--color-brand-600)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-brand-600)]'
            )}
          >
            <ArrowBigUp className="h-4 w-4" />
          </button>
          <span className={cn(
            'text-xs font-bold tabular-nums min-w-[20px] text-center',
            vote === 'up' && 'text-[var(--color-brand-600)]',
            vote === 'down' && 'text-red-500'
          )}>
            {score}
          </span>
          <button
            onClick={() => setVote(vote === 'down' ? null : 'down')}
            className={cn(
              'p-1 rounded transition-colors',
              vote === 'down'
                ? 'text-red-500'
                : 'text-[var(--color-text-muted)] hover:text-red-500'
            )}
          >
            <ArrowBigDown className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowReply(!showReply)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)] rounded transition-colors"
          >
            <Reply className="h-3.5 w-3.5" />
            Reply
          </button>
          <button className="p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)] rounded transition-colors">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Reply form */}
        {showReply && (
          <div className="pl-7 mt-2 animate-slide-down">
            <div className="border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden">
              <textarea
                placeholder="Write a reply..."
                className="w-full p-3 text-sm bg-[var(--color-bg)] border-none outline-none resize-none min-h-[80px]"
              />
              <div className="flex items-center justify-end gap-2 px-3 py-2 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)]">
                <button
                  onClick={() => setShowReply(false)}
                  className="px-3 py-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  Cancel
                </button>
                <button className="px-3 py-1 text-xs font-medium bg-[var(--color-brand-600)] text-white rounded-[var(--radius-sm)] hover:bg-[var(--color-brand-700)] transition-colors">
                  Reply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Children */}
      {comment.children && comment.children.length > 0 && (
        <div className="border-l-2 border-[var(--color-border)]">
          {comment.children.map((child) => (
            <CommentItem key={child.id} comment={child} postId={postId} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentThread({ comments, postId }: CommentThreadProps) {
  if (comments.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-[var(--color-text-muted)]">
          No comments yet. Be the first to share your thoughts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} postId={postId} />
      ))}
    </div>
  );
}
