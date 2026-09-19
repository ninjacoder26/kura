'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { requireSession, friendlyDbError } from '@/lib/dbErrors';
import { invalidateJoinedCommunities } from '@/lib/usePopularCommunities';
import { cn } from '@/lib/utils';

// Session-level membership cache so join buttons render their correct
// state instantly across navigations without refetching per row.
// Namespaced per user — never leaks one account's state into another.
const memberCache = new Map<string, boolean>();
const listeners = new Set<() => void>();

function cacheKey(userId: string | undefined, communityId: string) {
  return `${userId ?? 'anon'}:${communityId}`;
}

function setCached(userId: string | undefined, communityId: string, value: boolean) {
  memberCache.set(cacheKey(userId, communityId), value);
  listeners.forEach(l => l());
}

function getCached(userId: string | undefined, communityId: string): boolean | null {
  if (!userId) return false;
  return memberCache.get(cacheKey(userId, communityId)) ?? null;
}

/** Drop one user's cached rows (call after joining/leaving elsewhere). */
export function clearMemberCache(userId?: string): void {
  if (!userId) {
    memberCache.clear();
    return;
  }
  const prefix = `${userId}:`;
  Array.from(memberCache.keys()).forEach(k => {
    if (k.startsWith(prefix)) memberCache.delete(k);
  });
  listeners.forEach(l => l());
}

interface JoinButtonProps {
  communityId: string;
  communityName: string;
  className?: string;
}

/** Reddit-style Join/Joined pill with optimistic update. Safe inside cards wrapped in Links. */
export default function JoinButton({ communityId, communityName, className }: JoinButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [, force] = useState(0);
  const [checking, setChecking] = useState(false);

  const isMember = getCached(user?.id, communityId);

  useEffect(() => {
    const onChange = () => force(n => n + 1);
    listeners.add(onChange);
    return () => { listeners.delete(onChange); };
  }, []);

  useEffect(() => {
    if (!user || memberCache.has(cacheKey(user.id, communityId))) return;
    let cancelled = false;
    setChecking(true);
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('community_members')
          .select('id')
          .eq('community_id', communityId)
          .eq('user_id', user.id)
          .maybeSingle();
        if (!cancelled) setCached(user.id, communityId, !!data);
      } catch {
        // Leave as Join on failure; toggle will surface errors
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, communityId]);

  async function toggle(e: React.MouseEvent) {
    // Card rows are wrapped in Links — never navigate on join click.
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast('info', 'Log in to join communities');
      return;
    }
    const wasMember = getCached(user.id, communityId) ?? false;
    setCached(user.id, communityId, !wasMember);
    toast('success', wasMember ? `Left ${communityName}` : `Joined ${communityName}`);
    try {
      const supabase = createClient();
      if (!(await requireSession(supabase, () => {
        toast('error', 'Your session expired. Please log in again.');
        router.push('/login');
      }))) {
        setCached(user.id, communityId, wasMember);
        return;
      }
      if (wasMember) {
        const { error } = await supabase.from('community_members').delete().eq('community_id', communityId).eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('community_members').insert({ community_id: communityId, user_id: user.id });
        if (error) throw error;
      }
      invalidateJoinedCommunities(user.id);
    } catch (err: any) {
      setCached(user.id, communityId, wasMember);
      toast('error', friendlyDbError(err.message, { authed: true, action: wasMember ? 'leave this community' : 'join this community' }));
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={checking && isMember === null}
      className={cn(
        'kura-btn text-xs py-1 px-4 shrink-0',
        isMember
          ? 'border border-[var(--border)] text-[var(--fg2)] bg-transparent hover:border-[var(--border-strong)]'
          : 'bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)]',
        className
      )}
    >
      {isMember ? 'Joined' : 'Join'}
    </button>
  );
}
