'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export type VoteValue = 'up' | 'down';

/**
 * Feed vote/save cache.
 *
 * Pages batch-fetch the current user's votes + saves for a whole feed in
 * exactly 2 queries (see fetchAndCacheVotes) instead of 2 per card.
 * Cards read synchronously at mount (no flash) and subscribe to updates.
 *
 * Conventions:
 * - `voteCache.has(k)`  → resolved (value may be null = no vote).
 * - `voteFetched.has(k)` → claimed: a batch is in flight OR resolved.
 * - Absence from both   → unknown: card may fetch its own single row.
 * - All keys namespaced per user; optimistic actions write through.
 */

const voteCache = new Map<string, VoteValue | null>();
const voteFetched = new Set<string>();
const savedCache = new Map<string, boolean>();
const savedFetched = new Set<string>();

function key(userId: string, postId: string) {
  return `${userId}:${postId}`;
}

const listeners = new Set<() => void>();
function bump() {
  listeners.forEach(l => l());
}

export function subscribeFeedVotes(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Resolved vote, or undefined if not yet known. */
export function getCachedVote(userId: string, postId: string): VoteValue | null | undefined {
  const k = key(userId, postId);
  return voteCache.has(k) ? (voteCache.get(k) ?? null) : undefined;
}

/** Resolved saved flag, or undefined if not yet known. */
export function getCachedSaved(userId: string, postId: string): boolean | undefined {
  const k = key(userId, postId);
  return savedCache.has(k) ? (savedCache.get(k) ?? false) : undefined;
}

/** True once a batch (or own fetch) has resolved for this id. */
export function isVoteResolved(userId: string, postId: string) {
  return voteCache.has(key(userId, postId));
}

/** True while a batch is in flight or already resolved. */
export function isVoteClaimed(userId: string, postId: string) {
  return voteFetched.has(key(userId, postId));
}

/**
 * Batch-fetch votes + saves for ids (skips already-claimed ones).
 * Fire-and-forget friendly: claims synchronously so cards mounted right
 * after won't duplicate the work; resolves via a single bump.
 */
export async function fetchAndCacheVotes(
  supabase: SupabaseClient<any>,
  userId: string,
  postIds: string[]
): Promise<void> {
  const fresh = postIds.filter(id => !voteFetched.has(key(userId, id)));
  const freshSaved = postIds.filter(id => !savedFetched.has(key(userId, id)));
  const toFetch = Array.from(new Set([...fresh, ...freshSaved]));
  if (toFetch.length === 0) return;
  toFetch.forEach(id => {
    voteFetched.add(key(userId, id));
    savedFetched.add(key(userId, id));
  });

  try {
    const [voteRes, savedRes] = await Promise.all([
      supabase.from('votes').select('post_id, value').eq('user_id', userId).in('post_id', toFetch),
      supabase.from('saved_posts').select('post_id').eq('user_id', userId).in('post_id', toFetch),
    ]);
    const voted = new Set<string>();
    (voteRes.data as any[] | null)?.forEach((v: any) => {
      if (v?.post_id) {
        voteCache.set(key(userId, v.post_id), v.value === 1 ? 'up' : 'down');
        voted.add(v.post_id);
      }
    });
    toFetch.forEach(id => {
      if (!voted.has(id)) voteCache.set(key(userId, id), null);
    });
    const saved = new Set((savedRes.data as any[] | null)?.map((s: any) => s.post_id) ?? []);
    toFetch.forEach(id => savedCache.set(key(userId, id), saved.has(id)));
  } catch {
    // Release claims so cards fall back to their own single fetch.
    toFetch.forEach(id => {
      voteFetched.delete(key(userId, id));
      savedFetched.delete(key(userId, id));
    });
  } finally {
    bump();
  }
}

/** Single-row fallback used by cards when no batch covers them. */
export async function fetchAndCacheOne(
  supabase: SupabaseClient<any>,
  userId: string,
  postId: string
): Promise<{ vote: VoteValue | null; saved: boolean }> {
  const k = key(userId, postId);
  voteFetched.add(k);
  savedFetched.add(k);
  let vote: VoteValue | null = null;
  let saved = false;
  try {
    const [voteRes, savedRes] = await Promise.all([
      supabase.from('votes').select('value').eq('user_id', userId).eq('post_id', postId).maybeSingle(),
      supabase.from('saved_posts').select('id').eq('user_id', userId).eq('post_id', postId).maybeSingle(),
    ]);
    if (voteRes.data) vote = voteRes.data.value === 1 ? 'up' : 'down';
    saved = !!savedRes.data;
    voteCache.set(k, vote);
    savedCache.set(k, saved);
  } catch {
    voteFetched.delete(k);
    savedFetched.delete(k);
  } finally {
    bump();
  }
  return { vote, saved };
}

/** Write-through for optimistic votes. */
export function markVoted(userId: string, postId: string, value: VoteValue | null) {
  const k = key(userId, postId);
  voteFetched.add(k);
  voteCache.set(k, value);
  bump();
}

/** Write-through for optimistic save toggles. */
export function markSavedState(userId: string, postId: string, saved: boolean) {
  const k = key(userId, postId);
  savedFetched.add(k);
  savedCache.set(k, saved);
  bump();
}

// =============================================
// Comment votes (same pattern, separate namespace)
// =============================================

const commentVoteCache = new Map<string, VoteValue | null>();
const commentVoteFetched = new Set<string>();

function ckey(userId: string, commentId: string) {
  return `c:${userId}:${commentId}`;
}

/** Resolved comment vote, or undefined if not yet known. */
export function getCachedCommentVote(userId: string, commentId: string): VoteValue | null | undefined {
  const k = ckey(userId, commentId);
  return commentVoteCache.has(k) ? (commentVoteCache.get(k) ?? null) : undefined;
}

/** True while a thread batch is in flight or already resolved. */
export function isCommentVoteClaimed(userId: string, commentId: string) {
  return commentVoteFetched.has(ckey(userId, commentId));
}

/** Claim a single comment id for an own-fetch (prevents batch duplication). */
export function claimCommentVote(userId: string, commentId: string) {
  commentVoteFetched.add(ckey(userId, commentId));
}

/** Batch-fetch comment votes for a whole thread in 1 query. */
export async function fetchAndCacheCommentVotes(
  supabase: SupabaseClient<any>,
  userId: string,
  commentIds: string[]
): Promise<void> {
  const toFetch = commentIds.filter(id => !commentVoteFetched.has(ckey(userId, id)));
  if (toFetch.length === 0) return;
  toFetch.forEach(id => commentVoteFetched.add(ckey(userId, id)));

  try {
    const { data } = await supabase
      .from('votes')
      .select('comment_id, value')
      .eq('user_id', userId)
      .in('comment_id', toFetch);
    const voted = new Set<string>();
    (data as any[] | null)?.forEach((v: any) => {
      if (v?.comment_id) {
        commentVoteCache.set(ckey(userId, v.comment_id), v.value === 1 ? 'up' : 'down');
        voted.add(v.comment_id);
      }
    });
    toFetch.forEach(id => {
      if (!voted.has(id)) commentVoteCache.set(ckey(userId, id), null);
    });
  } catch {
    toFetch.forEach(id => commentVoteFetched.delete(ckey(userId, id)));
  } finally {
    bump();
  }
}

/** Write-through for optimistic comment votes. */
export function markCommentVoted(userId: string, commentId: string, value: VoteValue | null) {
  const k = ckey(userId, commentId);
  commentVoteFetched.add(k);
  commentVoteCache.set(k, value);
  bump();
}

/**
 * Feed-level sync: (re)batch whenever the visible posts or the user change.
 * No-op when everything is already claimed — covers login-after-load and
 * any batch the page forgot, without duplicating queries.
 */
export function useSyncFeedVotes(posts: { id: string }[], userId: string | undefined) {
  const idsKey = posts.map(p => p.id).join(',');
  useEffect(() => {
    if (!userId || posts.length === 0) return;
    fetchAndCacheVotes(createClient(), userId, posts.map(p => p.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, userId]);
}
