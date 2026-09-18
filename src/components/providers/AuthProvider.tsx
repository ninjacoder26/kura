'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  email?: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  reputation?: number;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (authUser: User) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url, reputation, role')
      .eq('id', authUser.id)
      .single();

    setUser({
      id: authUser.id,
      email: authUser.email,
      username: data?.username || authUser.email?.split('@')[0] || 'user',
      display_name: data?.display_name,
      avatar_url: data?.avatar_url,
      reputation: data?.reputation ?? 0,
      role: data?.role || 'user',
    });
  }, []);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      if (session?.user) {
        fetchProfile(session.user);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchProfile(session.user);
    } else {
      setUser(null);
    }
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/**
 * Synchronously checks whether a Supabase session token exists in local
 * storage. Used to render the correct logged-out UI on the very first
 * frame (before the async auth check resolves) so logged-out users never
 * see content flash in late. Best-effort: any doubt returns false and the
 * normal auth flow corrects the UI within a frame or two.
 */
export function hasStoredSession(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const ref = url.replace(/^https?:\/\//, '').split('.')[0];
    if (!ref) return false;
    return window.localStorage.getItem(`sb-${ref}-auth-token`) != null;
  } catch {
    return false;
  }
}

/**
 * True when the logged-out UI (hero, join promos) should show: authoritative
 * once auth resolves, best-guess on the first frame before that.
 */
export function useShowLoggedOutUI(): boolean {
  const { user, loading } = useAuth();
  const [bootLoggedOut, setBootLoggedOut] = useState<boolean | null>(null);
  useEffect(() => {
    setBootLoggedOut(!hasStoredSession());
  }, []);
  if (!loading) return !user;
  return bootLoggedOut === true;
}
