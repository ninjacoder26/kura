'use client';

import Link from 'next/link';
import { ArrowBigUp, ArrowBigDown, Reply, Trash2 } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { createClient } from '@/lib/supabase/client';

interface CommentAuthor {
  username: string;
  display_name?: string;
  avatar_url?: string;
}

export interface CommentData {
  id: string;
  body: string;
  post_id: string;
  author_id?: string;
  author: CommentAuthor;
  upvotes: number;
  downvotes: number;
  depth: number;
  created_at: string;
  children?: CommentData[];
}

interface CommentItemProps {
  comment: CommentData;
  onReplyAdded?: () => void;
}

function CommentItem({ comment, onReplyAdded }: CommentItemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const [score, setScore] = useState(comment.upvotes - comment.downvotes);
  const [showReply, setShowReply] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from('votes')
      .select('value')
      .eq('user_id', user.id)
      .eq('comment_id', comment.id)
      .single()
      .then(({ data }: { data: { value: number } | null }) => {
        if (data) setVote(data.value === 1 ? 'up' : 'down');
      });
  }, [user, comment.id]);

  // Sync score from props when they change
  useEffect(() => {
    setScore(comment.upvotes - comment.downvotes);
  }, [comment.upvotes, comment.downvotes]);

  async function handleVote(value: 'up' | 'down') {
    if (!user) {
      toast('info', 'Log in to vote');
      return;
    }

    const oldVote = vote;
    const newVote = vote === value ? null : value;

    // Optimistic UI update
    setVote(newVote);
    const delta =
      (newVote === 'up' ? 1 : newVote === 'down' ? -1 : 0) -
      (oldVote === 'up' ? 1 : oldVote === 'down' ? -1 : 0);
    setScore(score + delta);

    try {
      const supabase = createClient();
      let result;
      if (newVote) {
        result = await supabase
          .from('votes')
          .upsert({ user_id: user.id, comment_id: comment.id, value: newVote === 'up' ? 1 : -1 });
      } else {
        result = await supabase
          .from('votes')
          .delete()
          .eq('user_id', user.id)
          .eq('comment_id', comment.id);
      }

      if (result.error) throw result.error;
    } catch (err: any) {
      // Rollback on failure
      setVote(oldVote);
      setScore(comment.upvotes - comment.downvotes);
      toast('error', err.message || 'Failed to vote');
    }
  }

  async function handleReply() {
    if (!user || !replyBody.trim()) return;
    setSubmittingReply(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('comments').insert({
        body: replyBody.trim(),
        author_id: user.id,
        post_id: comment.post_id,
        parent_id: comment.id,
        depth: comment.depth + 1,
      });
      if (error) throw error;
      toast('success', 'Reply added');
      setShowReply(false);
      setReplyBody('');
      onReplyAdded?.();
    } catch (err: any) {
      toast('error', err.message || 'Failed');
    } finally {
      setSubmittingReply(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this comment?')) return;
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('comments')
        .update({ is_removed: true, body: '[deleted]' })
        .eq('id', comment.id);
      if (error) throw error;
      toast('success', 'Comment deleted');
      onReplyAdded?.();
    } catch (err: any) {
      toast('error', err.message || 'Failed');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={cn('py-2', comment.depth > 0 && 'ml-4 border-l-2 border-[var(--border)] pl-3')}>
      <div className="flex items-center gap-1.5 mb-1">
        <Avatar name={comment.author.display_name || comment.author.username} src={comment.author.avatar_url} size="xs" />
        <Link href={`/profile/${comment.author.username}`} className="text-xs font-bold text-[var(--fg)] hover:underline">
          @{comment.author.username}
        </Link>
        <span className="text-[var(--fg4)]">·</span>
        <time className="text-[11px] text-[var(--fg4)]">{formatDate(comment.created_at)}</time>
      </div>

      <p className="text-sm text-[var(--fg2)] leading-relaxed ml-7">{comment.body}</p>

      <div className="flex items-center gap-0.5 ml-6 mt-1">
        <button onClick={() => handleVote('up')} className={cn('vote-btn !h-6 !w-6', vote === 'up' && 'upvoted')} aria-label="Upvote comment">
          <ArrowBigUp className="h-4 w-4" fill={vote === 'up' ? 'currentColor' : 'none'} />
        </button>
        <span className={cn('text-[11px] font-bold tabular-nums min-w-[16px] text-center', vote === 'up' && 'text-[var(--brand-600)]', vote === 'down' && 'text-[#003893]')}>
          {score}
        </span>
        <button onClick={() => handleVote('down')} className={cn('vote-btn !h-6 !w-6', vote === 'down' && 'downvoted')} aria-label="Downvote comment">
          <ArrowBigDown className="h-4 w-4" fill={vote === 'down' ? 'currentColor' : 'none'} />
        </button>
        <button onClick={() => user ? setShowReply(!showReply) : toast('info', 'Log in to reply')} className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-[var(--fg4)] hover:bg-[var(--surface-hover)] rounded transition-colors ml-1">
          <Reply className="h-3.5 w-3.5" /> Reply
        </button>
        {user && user.id === comment.author_id && (
          <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        )}
      </div>

      {showReply && (
        <div className="ml-7 mt-2 anim-slide-down">
          <textarea
            value={replyBody}
            onChange={e => setReplyBody(e.target.value)}
            placeholder="What are your thoughts?"
            className="w-full p-2 text-sm bg-[var(--bg)] border border-[var(--border)] rounded outline-none resize-none min-h-[80px] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:border-[var(--brand-600)]"
            autoFocus
          />
          <div className="flex items-center justify-end gap-2 mt-1.5">
            <button onClick={() => { setShowReply(false); setReplyBody(''); }} className="text-xs font-bold text-[var(--fg4)] hover:text-[var(--fg)] px-2 py-1">Cancel</button>
            <button onClick={handleReply} disabled={!replyBody.trim() || submittingReply} className={cn('kura-btn text-xs', replyBody.trim() && !submittingReply ? 'bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)]' : 'bg-[var(--fg4)] text-[var(--bg)] cursor-not-allowed opacity-50')}>
              {submittingReply ? 'Posting...' : 'Reply'}
            </button>
          </div>
        </div>
      )}

      {comment.children && comment.children.length > 0 && (
        <div>
          {comment.children.map(child => <CommentItem key={child.id} comment={child} onReplyAdded={onReplyAdded} />)}
        </div>
      )}
    </div>
  );
}

export default function CommentThread({ comments, onCommentChange }: { comments: CommentData[]; onCommentChange?: () => void }) {
  if (comments.length === 0) {
    return <div className="py-8 text-center"><p className="text-xs text-[var(--fg4)]">No comments yet. Be the first to share what you think!</p></div>;
  }
  return <div>{comments.map(comment => <CommentItem key={comment.id} comment={comment} onReplyAdded={onCommentChange} />)}</div>;
}
