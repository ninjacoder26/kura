'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import CommentThread, { type CommentData, collectCommentIds } from '@/components/comments/CommentThread';
import RoleBadge from '@/components/ui/RoleBadge';
import ReportDialog from '@/components/moderation/ReportDialog';
import CommentForm from '@/components/comments/CommentForm';
import { LoadingSpinner, EmptyState } from '@/components/ui/Feedback';
import ImageLightbox from '@/components/ui/ImageLightbox';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, Bookmark, BookmarkCheck, ArrowLeft, Trash2, Pencil, ExternalLink, Maximize2, Flag, ImageOff, BellPlus, BellRing } from 'lucide-react';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { fetchAndCacheCommentVotes, markVoted, markSavedState } from '@/lib/feedVoteCache';
import { requireSession, friendlyDbError } from '@/lib/dbErrors';
import { rpcDelete } from '@/lib/deleteOps';
import { optimizeImageUrl, responsiveImage } from '@/lib/cloudinary';
import { useRouter } from 'next/navigation';

/** Never throws — an invalid post URL must not crash the page. */
function safeHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [id, setId] = useState('');
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const [score, setScore] = useState(0);
  const [saved, setSaved] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageBroken, setImageBroken] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [following, setFollowing] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [commentSort, setCommentSort] = useState<'best' | 'top' | 'new' | 'old'>('best');
  const [communityInfo, setCommunityInfo] = useState<any>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userRef = useRef(user);
  userRef.current = user;
  const reqRef = useRef(0);

  useEffect(() => { params.then(p => setId(p.id)); }, [params]);

  useEffect(() => {
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  const loadPost = useCallback(async () => {
    if (!id) return;
    const myReq = ++reqRef.current;
    const currentUser = userRef.current;
    try {
      const supabase = createClient();
      const { data: postData, error: postErr } = await supabase.from('posts').select('*, author:profiles!posts_author_id_fkey(username,display_name,avatar_url,role), community:communities!posts_community_id_fkey(id,name,slug,color,icon_url)').eq('id', id).single();
      if (postErr) throw postErr;
      // Deleted/lost author rows must never crash the page
      setPost(postData ? { ...postData, author: postData.author || { username: 'unknown' } } : postData);
      if (postData) setScore(postData.upvotes - postData.downvotes);

      // Community rail card (best effort)
      if (postData?.community_id) {
        supabase.from('communities').select('id, name, slug, description, color, icon_url, member_count, post_count, created_at').eq('id', postData.community_id).single()
          .then(({ data }: any) => { if (data) setCommunityInfo(data); });
      }

      const queries: Promise<any>[] = [
        supabase.from('comments').select('*, author:profiles!comments_author_id_fkey(username,display_name,avatar_url,role)').eq('post_id', id).eq('is_removed', false).order('created_at', { ascending: true })
      ];

      if (currentUser) {
        queries.push(
          supabase.from('votes').select('value').eq('user_id', currentUser.id).eq('post_id', id).single(),
          supabase.from('saved_posts').select('id').eq('user_id', currentUser.id).eq('post_id', id).single(),
          supabase.from('post_follows').select('id').eq('user_id', currentUser.id).eq('post_id', id).single()
        );
      }

      const results = await Promise.all(queries);

      // Stale (navigated to another post mid-flight) — drop it
      if (reqRef.current !== myReq) return;

      const commentResult = results[0];
      if (commentResult.data) {
        const flat = (commentResult.data as any[]).map((c: any) => ({ ...c, author: c.author || { username: 'unknown' }, children: [] as CommentData[] }));
        const map = new Map(flat.map((c: any) => [c.id, c]));
        const roots: CommentData[] = [];
        for (const c of flat) { if (c.parent_id && map.has(c.parent_id)) { map.get(c.parent_id)!.children!.push(c); } else { roots.push(c); } }
        // Batch thread votes in 1 query (claims sync so items mount warm)
        if (currentUser) fetchAndCacheCommentVotes(supabase, currentUser.id, collectCommentIds(roots));
        setComments(roots);
      }

      if (currentUser && results.length === 4) {
        const voteData = results[1].data;
        const savedData = results[2].data;
        const followData = results[3].data;
        if (voteData) setVote(voteData.value === 1 ? 'up' : 'down');
        if (savedData) setSaved(true);
        setFollowing(!!followData);
      }
    } catch (err: any) { if (reqRef.current === myReq) setError(err.message || 'Failed to load post'); } finally { if (reqRef.current === myReq) setLoading(false); }
  }, [id]);

  useEffect(() => { loadPost(); }, [loadPost]);

  // Re-check vote/save/follow when user changes (and clear on logout)
  useEffect(() => {
    if (!id) return;
    if (!user) {
      setVote(null);
      setSaved(false);
      setFollowing(false);
      return;
    }
    (async () => {
      const supabase = createClient();
      const [voteRes, savedRes, followRes] = await Promise.all([
        supabase.from('votes').select('value').eq('user_id', user.id).eq('post_id', id).single(),
        supabase.from('saved_posts').select('id').eq('user_id', user.id).eq('post_id', id).single(),
        supabase.from('post_follows').select('id').eq('user_id', user.id).eq('post_id', id).single()
      ]);
      if (voteRes.data) setVote(voteRes.data.value === 1 ? 'up' : 'down');
      if (savedRes.data) setSaved(true);
      setFollowing(!!followRes.data);
    })();
  }, [user, id]);

  async function handleVote(value: 'up' | 'down') {
    if (!user) { toast('info', 'Log in to vote'); return; }
    if (post?.is_locked) { toast('info', 'This post is locked'); return; }
    const oldValue = vote;
    const newValue = vote === value ? null : value;
    const oldScore = score;
    setVote(newValue);
    markVoted(user.id, id, newValue);
    let delta = 0;
    if (oldValue === 'up') delta -= 1;
    else if (oldValue === 'down') delta += 1;
    if (newValue === 'up') delta += 1;
    else if (newValue === 'down') delta -= 1;
    setScore(oldScore + delta);
    try {
      const supabase = createClient();
      if (!(await requireSession(supabase, () => {
        toast('error', 'Your session expired. Please log in again.');
        router.push('/login');
      }))) {
        setVote(oldValue);
        markVoted(user.id, id, oldValue);
        setScore(oldScore);
        return;
      }
      if (newValue) {
        const { error } = await supabase.from('votes').upsert({ user_id: user.id, post_id: id, value: newValue === 'up' ? 1 : -1 });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('votes').delete().eq('user_id', user.id).eq('post_id', id);
        if (error) throw error;
      }
    } catch (err: any) {
      setVote(oldValue);
      markVoted(user.id, id, oldValue);
      setScore(oldScore);
      toast('error', friendlyDbError(err.message, { authed: true, action: 'vote' }));
    }
  }

  async function handleSave() {
    if (!user) { toast('info', 'Log in to save posts'); return; }
    const oldSaved = saved;
    setSaved(!saved);
    markSavedState(user.id, id, !saved);
    try {
      const supabase = createClient();
      if (!(await requireSession(supabase, () => {
        toast('error', 'Your session expired. Please log in again.');
        router.push('/login');
      }))) {
        setSaved(oldSaved);
        markSavedState(user.id, id, oldSaved);
        return;
      }
      if (oldSaved) {
        const { error } = await supabase.from('saved_posts').delete().eq('user_id', user.id).eq('post_id', id);
        if (error) throw error;
        toast('success', 'Post unsaved');
      } else {
        const { error } = await supabase.from('saved_posts').insert({ user_id: user.id, post_id: id });
        if (error) throw error;
        toast('success', 'Post saved');
      }
    } catch (err: any) {
      setSaved(oldSaved);
      markSavedState(user.id, id, oldSaved);
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
    try {
      const supabase = createClient();
      if (!(await requireSession(supabase, () => {
        toast('error', 'Your session expired. Please log in again.');
        router.push('/login');
      }))) return;
      const outcome = await rpcDelete(supabase, 'delete_post', id);
      if (outcome.ok) {
        toast('success', 'Post deleted');
        router.push('/');
        return;
      }
      if (outcome.reason === 'missing_rpc') {
        const { error } = await supabase.from('posts').update({ is_removed: true }).eq('id', id);
        if (error) throw error;
        toast('success', 'Post deleted');
        router.push('/');
        return;
      }
      if (outcome.reason === 'forbidden') {
        throw new Error(user?.role === 'admin' ? 'DB_FORBIDDEN_ADMIN' : 'DB_FORBIDDEN');
      }
      if (outcome.reason === 'not_found') {
        toast('error', 'Already gone.');
        router.push('/');
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
    }
  }

  async function handleFollow() {
    if (!user) { toast('info', 'Log in to follow posts'); return; }
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    try {
      const supabase = createClient();
      if (!(await requireSession(supabase, () => {
        toast('error', 'Your session expired. Please log in again.');
        router.push('/login');
      }))) {
        setFollowing(wasFollowing);
        return;
      }
      if (wasFollowing) {
        const { error } = await supabase.from('post_follows').delete().eq('user_id', user.id).eq('post_id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('post_follows').insert({ user_id: user.id, post_id: id });
        if (error) throw error;
        toast('success', 'Following post — we\'ll notify you of new comments');
      }
    } catch (err: any) {
      setFollowing(wasFollowing);
      toast('error', friendlyDbError(err.message, { authed: true, action: 'follow this post' }));
    }
  }

  async function handleComment(body: string) {
    if (!user) { toast('info', 'Log in to comment'); return; }
    const supabase = createClient();
    if (!(await requireSession(supabase, () => {
      toast('error', 'Your session expired. Please log in again.');
      router.push('/login');
    }))) return;
    setSubmittingComment(true);
    try {
      const { error } = await supabase.from('comments').insert({ body, author_id: user.id, post_id: id });
      if (error) throw error;
      // Notify the post author (best effort, never blocks)
      if (post?.author_id && post.author_id !== user.id) {
        supabase.from('notifications').insert({
          user_id: post.author_id,
          type: 'comment',
          title: `${user.username} commented on your post`,
          body: body.slice(0, 140),
          link: `/post/${id}`,
        }).then(() => {});
      }
      // Notify followers (best effort, never blocks)
      supabase.from('post_follows').select('user_id').eq('post_id', id).neq('user_id', user.id).limit(100)
        .then(({ data }: { data: { user_id: string }[] | null }) => {
          const ids = ((data as any[]) || []).map(r => r.user_id).filter(f => f && f !== post?.author_id);
          if (ids.length === 0) return;
          supabase.from('notifications').insert(ids.map(f => ({
            user_id: f,
            type: 'comment',
            title: `${user.username} commented in a post you follow`,
            body: body.slice(0, 140),
            link: `/post/${id}`,
          }))).then(() => {});
        });
      toast('success', 'Comment added');
      await loadPost();
    } catch (err: any) { toast('error', friendlyDbError(err.message, { authed: true, action: 'comment' })); } finally { setSubmittingComment(false); }
  }

  function handleShare() {
    const url = `${window.location.origin}/post/${id}`;
    if (navigator.share) { navigator.share({ title: post.title, url }); return; }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(
        () => toast('success', 'Link copied to clipboard'),
        () => toast('error', 'Failed to copy link')
      );
    } else {
      toast('error', 'Clipboard not available');
    }
  }

  const sortedComments = useMemo(() => {
    const arr = [...comments];
    if (commentSort === 'top') arr.sort((a, b) => b.upvotes - a.upvotes);
    else if (commentSort === 'new') arr.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    else if (commentSort === 'old') arr.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    else arr.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
    return arr;
  }, [comments, commentSort]);

  const upvotePct =
    post && post.upvotes + post.downvotes > 0
      ? Math.round((post.upvotes / (post.upvotes + post.downvotes)) * 100)
      : 100;

  const detailImage = useMemo(() => responsiveImage(post?.image_url, { width: 1200 }), [post?.image_url]);

  if (loading && !post) return <div className="px-4 py-8"><LoadingSpinner /></div>;
  if (error || !post) return <div className="px-4 py-8"><EmptyState title={error || 'Post not found'} action={<Link href="/" className="kura-btn bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)] text-sm">Go home</Link>} /></div>;

  return (
      <div className="px-3 sm:px-4 py-3 w-full xl:max-w-[1240px] mx-auto flex gap-5 justify-center">
      <main className="flex-1 min-w-0 max-w-[740px]">
        <Link href={post.community ? `/k/${post.community.slug}` : '/'} className="inline-flex items-center gap-1 text-xs font-bold text-[var(--fg4)] hover:text-[var(--fg)] mb-3 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to {post.community ? `k/${post.community.slug}` : 'home'}
        </Link>

        <article className="post-card flex">
          <div className="flex flex-col items-center gap-0.5 px-1 py-2 w-10 sm:w-11 shrink-0">
            <button onClick={() => handleVote('up')} className={cn('vote-btn', vote === 'up' && 'upvoted')} aria-label="Upvote" aria-pressed={vote === 'up'}><ArrowBigUp className="h-6 w-6" fill={vote === 'up' ? 'currentColor' : 'none'} /></button>
            <span className={cn('text-xs font-bold tabular-nums leading-none', vote === 'up' && 'text-[var(--accent-500)]', vote === 'down' && 'text-[var(--brand-500)]')}>{formatNumber(score)}</span>
            <button onClick={() => handleVote('down')} className={cn('vote-btn', vote === 'down' && 'downvoted')} aria-label="Downvote" aria-pressed={vote === 'down'}><ArrowBigDown className="h-6 w-6" fill={vote === 'down' ? 'currentColor' : 'none'} /></button>
          </div>
          <div className="flex-1 min-w-0 p-3">
            <div className="flex items-center flex-wrap gap-x-1 text-xs text-[var(--fg4)]">
              {post.community && <><Link href={`/k/${post.community.slug}`} className="font-bold text-[var(--fg)] hover:underline">k/{post.community.slug}</Link><span>·</span></>}
              <Link href={`/profile/${post.author.username}`} className="hover:underline">u/{post.author.username}</Link><RoleBadge role={post.author.role} /><span>·</span><time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
            </div>
            <h1 className="text-xl font-semibold text-[var(--fg)] leading-snug mt-2 break-words">{post.title}</h1>
            {post.type === 'link' && post.url && safeHostname(post.url) && (
              <a href={post.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full text-xs font-medium text-[var(--brand-500)] bg-[var(--brand-500)]/10 hover:bg-[var(--brand-500)]/20 transition-colors">
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="truncate max-w-[300px]">{safeHostname(post.url)}</span>
              </a>
            )}
            {post.type === 'image' && post.image_url && (
              imageBroken ? (
                <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] py-12 flex flex-col items-center justify-center gap-2 text-[var(--fg4)]">
                  <ImageOff className="h-8 w-8" />
                  <span className="text-sm font-semibold">Image unavailable</span>
                </div>
              ) : (
              <div className="mt-2 relative group cursor-pointer" onClick={() => setLightboxOpen(true)}>
                <div className="relative rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg)]">
                  {!imageLoaded && <div className="w-full h-[300px] skeleton" />}
                  <img
                    src={detailImage.src}
                    srcSet={detailImage.srcSet}
                    sizes={detailImage.sizes}
                    alt={post.title}
                    loading="lazy"
                    decoding="async"
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageBroken(true)}
                    className={cn('max-h-[600px] w-full object-contain transition-opacity duration-300', imageLoaded ? 'opacity-100' : 'opacity-0 absolute')}
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
            {post.body && <div className="mt-3 text-sm text-[var(--fg2)] leading-relaxed whitespace-pre-wrap break-words">{post.body}</div>}
            <div className="flex items-center gap-1 mt-3 -ml-1 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--fg4)]"><MessageSquare className="h-5 w-5" /> {formatNumber(post.comment_count)} Comments</span>
              <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[var(--fg4)] hover:bg-[var(--surface-hover)] transition-colors"><Share2 className="h-5 w-5" /> Share</button>
              <button onClick={handleSave} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-[var(--surface-hover)] transition-colors', saved ? 'text-[var(--brand-500)]' : 'text-[var(--fg4)]')}>
                {saved ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />} {saved ? 'Saved' : 'Save'}
              </button>
              <button onClick={() => setReportOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[var(--fg4)] hover:bg-[var(--surface-hover)] transition-colors">
                <Flag className="h-5 w-5" /> Report
              </button>
              <button onClick={handleFollow} title={following ? 'Unfollow post' : 'Follow post'} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-[var(--surface-hover)] transition-colors', following ? 'text-[var(--brand-500)]' : 'text-[var(--fg4)]')}>
                {following ? <BellRing className="h-5 w-5" /> : <BellPlus className="h-5 w-5" />} {following ? 'Following' : 'Follow'}
              </button>
              {user && user.id === post.author_id && (
                <>
                  <Link href={`/post/${id}/edit`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[var(--fg4)] hover:bg-[var(--surface-hover)] transition-colors"><Pencil className="h-5 w-5" /> Edit</Link>
                  <button onClick={handleDeleteClick} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors', confirmingDelete ? 'bg-[var(--error)] text-white' : 'text-[var(--error)] hover:bg-red-50 dark:hover:bg-red-900/20')}><Trash2 className="h-5 w-5" /> {confirmingDelete ? 'Confirm?' : 'Delete'}</button>
                </>
              )}
              {user && user.role === 'admin' && user.id !== post.author_id && (
                <button onClick={handleDeleteClick} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors', confirmingDelete ? 'bg-[var(--error)] text-white' : 'text-[var(--error)] hover:bg-red-50 dark:hover:bg-red-900/20')}><Trash2 className="h-5 w-5" /> {confirmingDelete ? 'Confirm?' : 'Remove'}</button>
              )}
            </div>
          </div>
        </article>

        <div className="mt-3 mb-4">
          {post.is_locked ? (
            <div className="post-card p-4 text-center">
              <p className="text-sm text-[var(--fg3)]">This post is locked</p>
            </div>
          ) : user ? (
            <div className="post-card p-3">
              <p className="text-xs text-[var(--fg4)] mb-2">Comment as <span className="text-[var(--brand-500)] font-bold">{user.username}</span></p>
              <CommentForm onSubmit={handleComment} loading={submittingComment} />
            </div>
          ) : (
            <div className="post-card p-4 text-center">
              <p className="text-sm text-[var(--fg3)]"><Link href="/login" className="text-[var(--brand-500)] font-bold hover:underline">Log in</Link> or <Link href="/signup" className="text-[var(--brand-500)] font-bold hover:underline">sign up</Link> to leave a comment</p>
            </div>
          )}
        </div>

        {/* Comment sort — Reddit style */}
        <div className="flex items-center gap-1 mt-4 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--fg4)] mr-1">Sort by:</span>
          {([['best', 'Best'], ['top', 'Top'], ['new', 'New'], ['old', 'Old']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setCommentSort(key)}
              className={cn('text-xs font-bold px-2.5 py-1 rounded-full transition-colors', commentSort === key ? 'bg-[var(--surface-hover)] text-[var(--fg)]' : 'text-[var(--fg4)] hover:bg-[var(--surface-hover)]')}>
              {label}
            </button>
          ))}
        </div>

        <div className="pb-20 lg:pb-8"><CommentThread comments={sortedComments} onCommentChange={loadPost} locked={post.is_locked} /></div>
      </main>

      {/* Community rail — Reddit style */}
      <aside className="hidden xl:block w-[312px] shrink-0">
        <div className="sticky top-12 space-y-4">
          {communityInfo ? (
            <div className="sidebar-widget overflow-hidden">
              <div className="h-12" style={{ backgroundColor: communityInfo.color || 'var(--brand-600)' }} />
              <div className="p-3">
                <div className="flex items-center gap-2 -mt-7 mb-2">
                  <div
                    className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold border-[3px] border-[var(--surface)] shrink-0 overflow-hidden"
                    style={{ backgroundColor: communityInfo.color || 'var(--brand-600)' }}
                  >
                    {communityInfo.icon_url ? (
                      <img src={optimizeImageUrl(communityInfo.icon_url, { width: 128 })} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    ) : (
                      communityInfo.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <Link href={`/k/${communityInfo.slug}`} className="font-bold text-sm text-[var(--fg)] hover:underline truncate">
                    k/{communityInfo.slug}
                  </Link>
                </div>
                {communityInfo.description && (
                  <p className="text-xs text-[var(--fg3)] leading-relaxed line-clamp-3 break-words">{communityInfo.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border)] text-sm tabular-nums">
                  <div><p className="font-bold text-[var(--fg)]">{(communityInfo.member_count ?? 0).toLocaleString()}</p><p className="text-[11px] text-[var(--fg4)]">Members</p></div>
                  <div><p className="font-bold text-[var(--fg)]">{(communityInfo.post_count ?? 0).toLocaleString()}</p><p className="text-[11px] text-[var(--fg4)]">Posts</p></div>
                  <div><p className="font-bold text-[var(--accent-500)]">{upvotePct}%</p><p className="text-[11px] text-[var(--fg4)]">Upvoted</p></div>
                </div>
                <div className="text-[11px] text-[var(--fg4)] mt-2">
                  Created {new Date(communityInfo.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <Link href={`/submit?community=${communityInfo.slug}`} className="block mt-3">
                  <button className="kura-btn w-full bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)] text-sm py-2">Create Post</button>
                </Link>
              </div>
            </div>
          ) : post.community ? (
            <div className="sidebar-widget p-4">
              <Link href={`/k/${post.community.slug}`} className="font-bold text-sm text-[var(--fg)] hover:underline">
                k/{post.community.slug}
              </Link>
              <p className="text-xs text-[var(--fg4)] mt-1">View community</p>
            </div>
          ) : null}
        </div>
      </aside>

      {/* Report */}
      {reportOpen && (
        <ReportDialog targetType="post" targetId={id} onClose={() => setReportOpen(false)} />
      )}

      {/* Lightbox */}
      {lightboxOpen && post.image_url && (
        <ImageLightbox
          src={post.image_url}
          alt={post.title}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
