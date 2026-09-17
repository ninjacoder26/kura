'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { cn } from '@/lib/utils';

// Session-level membership cache so join buttons render their correct
// state instantly across navigations without refetching per row.
const memberCache = new Map<string, boolean>();
const listeners = new Set<() => void>();

function setCached(communityId: string, value: boolean) {
  memberCache.set(communityId, value);
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
  const [, force] = useState(0);
  const [checking, setChecking] = useState(false);

  const isMember = user ? (memberCache.get(communityId) ?? null) : false;

  useEffect(() => {
    const onChange = () => force(n => n + 1);
    listeners.add(onChange);
    return () => { listeners.delete(onChange); };
  }, []);

  useEffect(() => {
    if (!user || memberCache.has(communityId)) return;
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
        if (!cancelled) setCached(communityId, !!data);
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
    const wasMember = memberCache.get(communityId) ?? false;
    setCached(communityId, !wasMember);
    toast('success', wasMember ? `Left ${communityName}` : `Joined ${communityName}`);
    try {
      const supabase = createClient();
      if (wasMember) {
        const { error } = await supabase.from('community_members').delete().eq('community_id', communityId).eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('community_members').insert({ community_id: communityId, user_id: user.id });
        if (error) throw error;
      }
    } catch (err: any) {
      setCached(communityId, wasMember);
      toast('error', err.message || 'Failed');
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
