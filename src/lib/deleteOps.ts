'use client';

import type { SupabaseClient } from '@supabase/supabase-js';

export type DeleteOutcome =
  | { ok: true }
  | {
      ok: false;
      reason: 'forbidden' | 'not_found' | 'session' | 'missing_rpc' | 'error';
      message?: string;
    };

/**
 * Delete via the bulletproof RPC functions (migration 013), which enforce
 * author-or-admin in code and work regardless of RLS policy state.
 * Returns missing_rpc when 013 was never run so callers can fall back to
 * a direct update instead of failing.
 */
export async function rpcDelete(
  supabase: SupabaseClient<any>,
  fn: 'delete_post' | 'delete_comment',
  id: string
): Promise<DeleteOutcome> {
  const args = fn === 'delete_post' ? { p_post_id: id } : { p_comment_id: id };
  try {
    const { data, error } = await supabase.rpc(fn, args);
    if (error) {
      if (
        (error as any).code === 'PGRST202' ||
        /could not find the function|not found in schema/i.test(error.message || '')
      ) {
        return { ok: false, reason: 'missing_rpc' };
      }
      return { ok: false, reason: 'error', message: error.message };
    }
    const r = data as any;
    if (r?.ok) return { ok: true };
    if (r?.code === 'forbidden') return { ok: false, reason: 'forbidden' };
    if (r?.code === 'not_found') return { ok: false, reason: 'not_found' };
    return { ok: false, reason: 'session' };
  } catch (err: any) {
    return { ok: false, reason: 'error', message: err?.message };
  }
}
