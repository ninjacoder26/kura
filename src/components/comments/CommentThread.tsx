'use client';

import Link from 'next/link';
import { ArrowBigUp, ArrowBigDown, Reply } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';
import { useState } from 'react';
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
  author: CommentAuthor;
  upvotes: number;
  downvotes: number;
  depth: number;
  created_at: string;
  children?: CommentData[];
}

function CommentItem({ comment }: { comment: CommentData }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const [showReply, setShowReply] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const score = comment.upvotes - comment.downvotes + (vote === 'up' ? 1 : vote === 'down' ? -1 : 0);

  async function handleVote(value: 'up' | 'down') {
    if (!user) { toast('info', 'Log in to vote'); return; }
    const supabase = createClient();
    const newValue = vote === value ? null : value;
    setVote(newValue);
    if (newValue) {
      await supabase.from('votes').upsert({ user_id: user.id, comment_id: comment.id, value: newValue === 'up' ? 1 : -1 });
    } else {
      await supabase.from('votes').delete().eq('user_id', user.id).eq('comment_id', comment.id);
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
    } catch (err: any) {
      toast('error', err.message || 'Failed');
    } finally {
      setSubmittingReply(false);
    }
  }

  return (
    <div className="anim-fade-up" style={{ marginLeft: comment.depth > 0 ? `${Math.min(comment.depth * 16, 64)}px` : 0 }}>
      <div className="group py-2">
        <div className="flex items-center gap-2 mb-1">
          <Avatar name={comment.author.display_name || comment.author.username} src={comment.author.avatar_url} size="xs" />
          <Link href={`/profile/${comment.author.username}`} className="text-xs font-semibold text-[var(--fg)] hover:underline">
            {comment.author.username}
          </Link>
          <span className="text-[var(--fg4)]">·</span>
          <time className="text-[11px] text-[var(--fg4)]">{formatDate(comment.created_at)}</time>
        </div>

        <p className="text-sm text-[var(--fg)] leading-relaxed pl-7 sm:pl-8">{comment.body}</p>

        <div className="flex items-center gap-0.5 pl-5 sm:pl-6 mt-1">
          <button onClick={() => handleVote('up')} className={cn('p-1 rounded transition-color', vote === 'up' ? 'text-[var(--brand-600)]' : 'text-[var(--fg4)] hover:text-[var(--brand-600)]')}>
            <ArrowBigUp className="h-4 w-4" />
          </button>
          <span className={cn('text-xs font-bold tabular-nums min-w-[18px] text-center', vote === 'up' && 'text-[var(--brand-600)]', vote === 'down' && 'text-red-500')}>
            {score}
          </span>
          <button onClick={() => handleVote('down')} className={cn('p-1 rounded transition-color', vote === 'down' ? 'text-red-500' : 'text-[var(--fg4)] hover:text-red-500')}>
            <ArrowBigDown className="h-4 w-4" />
          </button>
          <button onClick={() => user ? setShowReply(!showReply) : toast('info', 'Log in to reply')} className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--fg4)] hover:bg-[var(--bg-raised)] rounded transition-colors">
            <Reply className="h-3.5 w-3.5" /> Reply
          </button>
        </div>

        {showReply && (
          <div className="pl-7 sm:pl-8 mt-2 anim-slide-down">
            <div className="border border-[var(--border)] rounded-[var(--r-md)] overflow-hidden focus-within:ring-1 focus-within:ring-[var(--brand-500)]">
              <textarea
                value={replyBody}
                onChange={e => setReplyBody(e.target.value)}
                placeholder="Write a reply..."
                className="w-full p-3 text-sm bg-[var(--bg)] border-none outline-none resize-none min-h-[80px] text-[var(--fg)] placeholder:text-[var(--fg4)]"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2 px-3 py-2 bg-[var(--bg-alt)] border-t border-[var(--border)]">
                <button onClick={() => { setShowReply(false); setReplyBody(''); }} className="px-3 py-1 text-xs text-[var(--fg4)] hover:text-[var(--fg)] transition-colors">Cancel</button>
                <button onClick={handleReply} disabled={!replyBody.trim() || submittingReply} className="px-3 py-1 text-xs font-medium bg-[var(--brand-600)] text-white rounded-[var(--r-sm)] hover:bg-[var(--brand-700)] transition-colors disabled:opacity-50">
                  {submittingReply ? 'Posting...' : 'Reply'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {comment.children && comment.children.length > 0 && (
        <div className="border-l-2 border-[var(--border)] ml-1.5">
          {comment.children.map(child => <CommentItem key={child.id} comment={child} />)}
        </div>
      )}
    </div>
  );
}

export default function CommentThread({ comments }: { comments: CommentData[] }) {
  if (comments.length === 0) {
    return <div className="py-10 text-center"><p className="text-sm text-[var(--fg4)]">No comments yet. Start the conversation.</p></div>;
  }
  return <div>{comments.map(comment => <CommentItem key={comment.id} comment={comment} />)}</div>;
}
