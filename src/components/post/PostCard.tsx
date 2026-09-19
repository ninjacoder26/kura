'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, Bookmark, BookmarkCheck, Trash2, Pencil, ExternalLink, Maximize2, MoreHorizontal, Flag, ImageOff } from 'lucide-react';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { createClient } from '@/lib/supabase/client';
import { requireSession, friendlyDbError } from '@/lib/dbErrors';
import { rpcDelete } from '@/lib/deleteOps';
import { bumpTagAffinity } from '@/lib/tagAffinity';
import { optimizeImageUrl } from '@/lib/cloudinary';
import JoinButton from '@/components/community/JoinButton';
import RoleBadge from '@/components/ui/RoleBadge';
import {
  getCachedVote,
  getCachedSaved,
  isVoteResolved,
  isVoteClaimed,
  fetchAndCacheOne,
  markVoted,
  markSavedState,
  subscribeFeedVotes,
} from '@/lib/feedVoteCache';
import ImageLightbox from '@/components/ui/ImageLightbox';
import ReportDialog from '@/components/moderation/ReportDialog';

interface PostAuthor {
  username: string;
  display_name?: string;
  avatar_url?: string;
  role?: string | null;
}

interface PostCommunity {
  id?: string;
  name: string;
  slug: string;
  color?: string;
  icon_url?: string | null;
}

export interface PostData {
  id: string;
  title: string;
  body?: string;
  type?: string;
  url?: string;
  image_url?: string;
  tags?: string[] | null;
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

function sanitizeUrl(url: string): string | null {
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:')) {
    return null;
  }
  return url;
}

/** Never throws — an invalid post URL must not crash the feed. */
function safeHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const PostCard = memo(function PostCard({ post, showCommunity = true, onDelete }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const userId = user?.id;
  // Resolved synchronously from the feed batch cache when available.
  const [vote, setVote] = useState<'up' | 'down' | null>(() => (userId ? getCachedVote(userId, post.id) ?? null : null));
  const [score, setScore] = useState(post.upvotes - post.downvotes);
  const [saved, setSaved] = useState(() => (userId ? getCachedSaved(userId, post.id) ?? false : false));
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageBroken, setImageBroken] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // Once the user interacts, incoming cache updates must not clobber state
  // (the interaction itself writes through to the cache anyway).
  const interactedRef = useRef(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  // Adopt late-arriving batch results (or login) unless the user interacted.
  useEffect(() => {
    if (!userId) return;
    return subscribeFeedVotes(() => {      if (interactedRef.current) return;
      const v = getCachedVote(userId, post.id);
      if (v !== undefined) setVote(v);
      const s = getCachedSaved(userId, post.id);
      if (s !== undefined) setSaved(s);
    });
  }, [userId, post.id]);

  // Reset on logout/account switch so one account's state never shows on another.
  useEffect(() => {
    if (!userId) {
      interactedRef.current = false;
      setVote(null);
      setSaved(false);
    }
  }, [userId]);

  // Single-row fallback: only when no batch covers this card (batch failed,
  // or user logged in after the feed loaded). Deferred a tick so a parent
  // batch effect (which always runs after child effects in the same commit)
  // gets first claim — avoiding duplicate queries.
  useEffect(() => {
    if (!userId) return;
    if (isVoteResolved(userId, post.id) || isVoteClaimed(userId, post.id)) return;
    const t = setTimeout(() => {
      if (interactedRef.current) return;
      if (isVoteResolved(userId, post.id) || isVoteClaimed(userId, post.id)) return;
      fetchAndCacheOne(createClient(), userId, post.id).then(({ vote: v, saved: s }) => {
        if (interactedRef.current) return;
        setVote(v);
        setSaved(s);
      });
    }, 0);
    return () => clearTimeout(t);
  }, [userId, post.id]);

  useEffect(() => {
    setScore(post.upvotes - post.downvotes);
  }, [post.upvotes, post.downvotes]);

  async function handleVote(value: 'up' | 'down') {
    if (!user) { toast('info', 'Log in to vote'); return; }
    if (post.is_locked) { toast('info', 'This post is locked'); return; }
    const oldVote = vote;
    const newVote = vote === value ? null : value;
    interactedRef.current = true;
    setVote(newVote);
    markVoted(user.id, post.id, newVote);
    // Recommendations react instantly: upvotes grow tag affinity, un-votes shrink it
    if (newVote === 'up' && oldVote !== 'up') bumpTagAffinity(user.id, post.tags, 1);
    else if (oldVote === 'up' && newVote !== 'up') bumpTagAffinity(user.id, post.tags, -1);
    const delta = (newVote === 'up' ? 1 : newVote === 'down' ? -1 : 0) - (oldVote === 'up' ? 1 : oldVote === 'down' ? -1 : 0);
    setScore(score + delta);

    try {
      const supabase = createClient();
      if (!(await requireSession(supabase, () => {
        toast('error', 'Your session expired. Please log in again.');
        router.push('/login');
      }))) {
        setVote(oldVote);
        markVoted(user.id, post.id, oldVote);
        setScore(post.upvotes - post.downvotes);
        return;
      }
      let result;
      if (newVote) {
        result = await supabase.from('votes').upsert({ user_id: user.id, post_id: post.id, value: newVote === 'up' ? 1 : -1 });
      } else {
        result = await supabase.from('votes').delete().eq('user_id', user.id).eq('post_id', post.id);
      }
      if (result.error) throw result.error;
    } catch (err: any) {
      setVote(oldVote);
      markVoted(user.id, post.id, oldVote);
      if (newVote === 'up' && oldVote !== 'up') bumpTagAffinity(user.id, post.tags, -1);
      else if (oldVote === 'up' && newVote !== 'up') bumpTagAffinity(user.id, post.tags, 1);
      setScore(post.upvotes - post.downvotes);
      toast('error', friendlyDbError(err.message, { authed: true, action: 'vote' }));
    }
  }

  async function handleSave() {
    if (!user) { toast('info', 'Log in to save posts'); return; }
    const oldSaved = saved;
    interactedRef.current = true;
    setSaved(!oldSaved);
    markSavedState(user.id, post.id, !oldSaved);
    try {
      const supabase = createClient();
      if (!(await requireSession(supabase, () => {
        toast('error', 'Your session expired. Please log in again.');
        router.push('/login');
      }))) {
        setSaved(oldSaved);
        markSavedState(user.id, post.id, oldSaved);
        return;
      }
      let result;
      if (oldSaved) {
        result = await supabase.from('saved_posts').delete().eq('user_id', user.id).eq('post_id', post.id);
      } else {
        result = await supabase.from('saved_posts').insert({ user_id: user.id, post_id: post.id });
      }
      if (result.error) throw result.error;
      toast('success', oldSaved ? 'Post unsaved' : 'Post saved');
    } catch (err: any) {
      setSaved(oldSaved);
      markSavedState(user.id, post.id, oldSaved);
      toast('error', friendlyDbError(err.message, { authed: true, action: 'save this post' }));
    }
  }

  function handleDeleteClick() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmingDelete(false), 3000);
      return;
    }
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    setConfirmingDelete(false);
    handleDelete();
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const supabase = createClient();
      if (!(await requireSession(supabase, () => {
        toast('error', 'Your session expired. Please log in again.');
        router.push('/login');
      }))) return;
      // Bulletproof RPC first (works regardless of RLS policy state),
      // legacy direct update when migration 013 was never run.
      const outcome = await rpcDelete(supabase, 'delete_post', post.id);
      if (outcome.ok) {
        toast('success', 'Post deleted');
        onDelete?.(post.id);
        return;
      }
      if (outcome.reason === 'missing_rpc') {
        const { error } = await supabase.from('posts').update({ is_removed: true }).eq('id', post.id);
        if (error) throw error;
        toast('success', 'Post deleted');
        onDelete?.(post.id);
        return;
      }
      if (outcome.reason === 'forbidden') {
        throw new Error(
          user?.role === 'admin'
            ? 'DB_FORBIDDEN_ADMIN'
            : 'DB_FORBIDDEN'
        );
      }
      if (outcome.reason === 'not_found') {
        toast('error', 'Already gone — refreshing.');
        onDelete?.(post.id);
        return;
      }
      if (outcome.reason === 'session') {
        toast('error', 'Your session expired. Please log in again.');
        router.push('/login');
        return;
      }
      throw new Error(outcome.message || 'Delete failed');
    } catch (err: any) {
      const m = err.message || '';
      if (m === 'DB_FORBIDDEN_ADMIN') {
        toast('error', 'Database refused this. Run migrations 007, 012 and 013 in the Supabase SQL editor, then retry.');
      } else if (m === 'DB_FORBIDDEN') {
        toast('error', "This isn't yours to delete.");
      } else {
        toast('error', friendlyDbError(m, { authed: true, action: 'delete this post', adminHint: user?.role === 'admin' }));
      }
    } finally {
      setDeleting(false);
    }
  }

  function handleShare() {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      navigator.share({ title: post.title, url });
    } else if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(
        () => toast('success', 'Link copied to clipboard'),
        () => toast('error', 'Failed to copy')
      );
    }
  }

  const handleImageLoad = useCallback(() => setImageLoaded(true), []);

  return (
    <>
      <div className="post-card flex">
        {/* Vote column - Reddit style: transparent, same surface as card */}
        <div className="flex flex-col items-center gap-0.5 px-1 py-2 w-[36px] sm:w-[40px] shrink-0">
          <button onClick={() => handleVote('up')} className={cn('vote-btn', vote === 'up' && 'upvoted')} aria-label="Upvote" aria-pressed={vote === 'up'}>
            <ArrowBigUp className="h-[22px] w-[22px]" fill={vote === 'up' ? 'currentColor' : 'none'} />
          </button>
          <span className={cn('text-xs font-bold tabular-nums leading-none', vote === 'up' && 'text-[var(--accent-500)]', vote === 'down' && 'text-[var(--brand-500)]')}>
            {formatNumber(score)}
          </span>
          <button onClick={() => handleVote('down')} className={cn('vote-btn', vote === 'down' && 'downvoted')} aria-label="Downvote" aria-pressed={vote === 'down'}>
            <ArrowBigDown className="h-[22px] w-[22px]" fill={vote === 'down' ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 p-2.5 sm:p-3">
          {/* Meta line - Reddit style */}
          <div className="flex items-center flex-wrap gap-x-1.5 text-[12px] text-[var(--fg4)]">
            {post.is_pinned && <span className="text-[var(--success)] font-semibold">Pinned</span>}
            {showCommunity && post.community && (
              <>
                {post.community.icon_url ? (
                  <img src={optimizeImageUrl(post.community.icon_url, { width: 64 })} alt="" loading="lazy" decoding="async" className="h-5 w-5 rounded-full object-cover shrink-0" />
                ) : (
                  <span
                    className="h-5 w-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                    style={{ backgroundColor: post.community.color || 'var(--brand-600)' }}
                  >
                    {post.community.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <Link href={`/k/${post.community.slug}`} className="font-semibold text-[var(--fg)] hover:underline">k/{post.community.slug}</Link>
                <span className="text-[var(--fg4)]">·</span>
              </>
            )}
            <Link href={`/profile/${post.author.username}`} className="hover:underline">u/{post.author.username}</Link>
            <RoleBadge role={post.author.role} />
            <span className="text-[var(--fg4)]">·</span>
            <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
            {showCommunity && post.community?.id && (
              <span className="ml-auto pl-2">
                <JoinButton communityId={post.community.id} communityName={post.community.name} className="!text-xs !py-1 !px-3.5 !min-h-[28px]" />
              </span>
            )}
          </div>

          {/* Title */}
          <Link href={`/post/${post.id}`} className="block group/title mt-1.5">
            <h3 className="text-[18px] font-semibold text-[var(--fg)] group-hover/title:underline leading-snug break-words">{post.title}</h3>
          </Link>

          {/* Link preview */}
          {post.type === 'link' && post.url && sanitizeUrl(post.url) && safeHostname(post.url) && (
            <a href={sanitizeUrl(post.url)!} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full text-xs font-medium text-[var(--brand-500)] bg-[var(--brand-500)]/10 hover:bg-[var(--brand-500)]/20 transition-colors">
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="truncate max-w-[200px]">{safeHostname(post.url)}</span>
            </a>
          )}

          {/* Image preview - Reddit card style */}
          {post.type === 'image' && post.image_url && (
            imageBroken ? (
              <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] py-10 flex flex-col items-center justify-center gap-2 text-[var(--fg4)]">
                <ImageOff className="h-6 w-6" />
                <span className="text-xs font-semibold">Image unavailable</span>
              </div>
            ) : (
            <div className="mt-2 relative group cursor-pointer" onClick={() => setLightboxOpen(true)}>
              <div className="relative rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg)]">
                {!imageLoaded && (
                  <div className="w-full h-[200px] sm:h-[300px] skeleton" />
                )}
                <img
                  src={optimizeImageUrl(post.image_url, { width: 1080 })}
                  alt={post.title}
                  loading="lazy"
                  decoding="async"
                  onLoad={handleImageLoad}
                  onError={() => setImageBroken(true)}
                  className={cn(
                    'max-h-[512px] w-full object-contain transition-opacity duration-300',
                    imageLoaded ? 'opacity-100' : 'opacity-0 absolute'
                  )}
                />
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="h-8 w-8 rounded-full bg-black/60 flex items-center justify-center text-white">
                  <Maximize2 className="h-4 w-4" />
                </div>
              </div>
            </div>
            )
          )}

          {/* Body preview */}
          {post.body && (
            <div className="mt-2 text-sm text-[var(--fg3)] line-clamp-3 leading-relaxed break-words">
              {post.body}
            </div>
          )}

          {/* AI tags — visible to admins only (engine + search use them silently) */}
          {user?.role === 'admin' && post.tags && post.tags.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {post.tags.slice(0, 3).map(tag => (
                <Link
                  key={tag}
                  href={`/tag/${encodeURIComponent(tag)}`}
                  onClick={e => e.stopPropagation()}
                  className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-[var(--brand-500)] bg-[var(--brand-500)]/10 hover:bg-[var(--brand-500)]/20 transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Action bar - Reddit style with proper spacing */}
          <div className="flex items-center gap-1 mt-2 -ml-1 flex-wrap">
            <Link href={`/post/${post.id}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[var(--fg4)] hover:bg-[var(--surface-hover)] transition-colors">
              <MessageSquare className="h-5 w-5" />
              <span>{formatNumber(post.comment_count)} Comments</span>
            </Link>
            <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[var(--fg4)] hover:bg-[var(--surface-hover)] transition-colors">
              <Share2 className="h-5 w-5" /> Share
            </button>
            <button onClick={handleSave} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-[var(--surface-hover)] transition-colors', saved ? 'text-[var(--brand-500)]' : 'text-[var(--fg4)]')}>
              {saved ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />} {saved ? 'Saved' : 'Save'}
            </button>
            <div ref={menuRef} className="relative">
              <button onClick={() => setMenuOpen(o => !o)} aria-label="More actions" className="flex items-center px-2 py-1.5 rounded-full text-[var(--fg4)] hover:bg-[var(--surface-hover)] transition-colors">
                <MoreHorizontal className="h-5 w-5" />
              </button>
              {menuOpen && (
                <div className="absolute left-0 top-full mt-1 w-40 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)] py-1 z-30 anim-scale-in">
                  <button
                    onClick={() => { setMenuOpen(false); setReportOpen(true); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[var(--fg2)] hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <Flag className="h-4 w-4" /> Report
                  </button>
                </div>
              )}
            </div>
            {user && user.id === post.author_id && (
              <Link href={`/post/${post.id}/edit`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[var(--fg4)] hover:bg-[var(--surface-hover)] transition-colors">
                <Pencil className="h-5 w-5" /> Edit
              </Link>
            )}
            {user && (user.id === post.author_id || user.role === 'admin') && (
              <button onClick={handleDeleteClick} disabled={deleting} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors', confirmingDelete ? 'bg-[var(--error)] text-white' : 'text-[var(--error)] hover:bg-red-50 dark:hover:bg-red-900/20')}>
                <Trash2 className="h-5 w-5" /> {confirmingDelete ? (deleting ? 'Deleting…' : 'Confirm?') : 'Delete'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && post.image_url && (
        <ImageLightbox
          src={post.image_url}
          alt={post.title}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Report */}
      {reportOpen && (
        <ReportDialog targetType="post" targetId={post.id} onClose={() => setReportOpen(false)} />
      )}
    </>
  );
});

export default PostCard;
