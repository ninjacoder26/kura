'use client';

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Verifies a live session before a mutation runs. getSession() transparently
 * refreshes an expired-but-refreshable token; only truly dead sessions fail.
 * Without this, mutations fire anonymously and die with cryptic RLS errors
 * (e.g. "new row violates row-level security policy").
 */
export async function requireSession(
  supabase: SupabaseClient<any>,
  onExpired: () => void
): Promise<boolean> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      onExpired();
      return false;
    }
    return true;
  } catch {
    onExpired();
    return false;
  }
}

/**
 * Translates raw Supabase/PostgREST errors into something a human can act on.
 */
export function friendlyDbError(
  message: string | undefined,
  opts: { authed: boolean; action?: string; adminHint?: boolean }
): string {
  const msg = message || '';
  const action = opts.action || 'do that';
  if (/row-level security|RLS|policy/i.test(msg)) {
    const adminNote = opts.adminHint
      ? ' As admin, run migrations 007 and 012 in the Supabase SQL editor, then retry.'
      : '';
    return opts.authed
      ? `You don't have permission to ${action}. If this is yours, log out and back in, then retry.${adminNote}`
      : 'Your session expired. Please log in again.';
  }
  if (/jwt|token expired|invalid token|refresh token/i.test(msg)) {
    return 'Your session expired. Please log in again.';
  }
  if (/duplicate|already exists|unique constraint/i.test(msg)) {
    return 'Already recorded.';
  }
  if (/fetch|network|load failed|timeout|timed out|econn/i.test(msg)) {
    return 'Network hiccup — please try again.';
  }
  return msg || 'Something went wrong. Please try again.';
}
