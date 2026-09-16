'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/providers/ToastProvider';
import { useAuth } from '@/components/providers/AuthProvider';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const redirectTo = searchParams.get('redirect') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirectTo);
    }
  }, [user, authLoading, redirectTo, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    toast('success', 'Logged in successfully');
    router.push(redirectTo);
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}` },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm anim-fade-up">
        <div className="text-center mb-6">
          <div className="h-10 w-10 rounded-full bg-[var(--brand-500)] flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-lg">K</span>
          </div>
          <h1 className="text-lg font-medium text-[var(--fg)]">Log In</h1>
          <p className="text-xs text-[var(--fg4)] mt-1">Welcome back to Kura</p>
        </div>

        <button onClick={handleGoogle} type="button"
          className="kura-btn w-full border border-[var(--border)] text-[var(--fg2)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] bg-transparent text-sm py-2.5 mb-4">
          <svg className="h-4 w-4 mr-2 inline" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]" /></div>
          <div className="relative flex justify-center text-[11px]"><span className="px-2 bg-[var(--bg)] text-[var(--fg4)]">OR</span></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <div className="p-3 rounded text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">{error}</div>}
          <div>
            <label className="block text-xs font-bold text-[var(--fg2)] mb-1.5 uppercase tracking-wide">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required autoComplete="email"
              className="w-full h-10 px-3 text-sm rounded border bg-[var(--bg)] border-[var(--border)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-500)] transition-all hover:border-[var(--border-strong)]" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[var(--fg2)] uppercase tracking-wide">Password</label>
              <Link href="/forgot-password" className="text-xs text-[var(--brand-500)] font-bold hover:underline">Forgot?</Link>
            </div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required autoComplete="current-password"
              className="w-full h-10 px-3 text-sm rounded border bg-[var(--bg)] border-[var(--border)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-500)] transition-all hover:border-[var(--border-strong)]" />
          </div>
          <button type="submit" disabled={loading} className="kura-btn w-full bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)] disabled:opacity-50 py-2.5">
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-[var(--fg4)]">
          New to Kura? <Link href="/signup" className="text-[var(--brand-500)] font-bold hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand-500)] border-t-transparent" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
