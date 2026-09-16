'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/providers/ToastProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { Check, X, Loader2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  // (#50): Debounced username availability check
  const checkUsername = useCallback(async (value: string) => {
    if (value.length < 3) { setUsernameStatus('idle'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) { setUsernameStatus('idle'); return; }
    setUsernameStatus('checking');
    try {
      const supabase = createClient();
      const { data } = await supabase.from('profiles').select('id').eq('username', value).single();
      setUsernameStatus(data ? 'taken' : 'available');
    } catch {
      setUsernameStatus('available');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => checkUsername(username), 500);
    return () => clearTimeout(timer);
  }, [username, checkUsername]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');

    if (username.length < 3) { setError('Username must be at least 3 characters'); setLoading(false); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError('Letters, numbers, and underscores only'); setLoading(false); return; }
    if (usernameStatus === 'taken') { setError('Username is already taken'); setLoading(false); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, full_name: username },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) { setError(authError.message); setLoading(false); return; }
    setSuccess(true); setLoading(false);
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  function getUsernameIcon() {
    if (usernameStatus === 'checking') return <Loader2 className="h-4 w-4 text-[var(--fg4)] animate-spin" />;
    if (usernameStatus === 'available') return <Check className="h-4 w-4 text-emerald-500" />;
    if (usernameStatus === 'taken') return <X className="h-4 w-4 text-red-500" />;
    return null;
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm text-center anim-fade-up">
          <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
            <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-lg font-medium text-[var(--fg)]">Check your email</h1>
          <p className="text-xs text-[var(--fg3)] mt-2">We sent a confirmation link to <strong>{email}</strong>.</p>
          <Link href="/login" className="inline-block mt-4">
            <button className="kura-btn border border-[var(--border)] text-[var(--fg2)] hover:border-[var(--border-strong)] bg-transparent text-xs">Back to login</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm anim-fade-up">
        <div className="text-center mb-6">
          <div className="h-10 w-10 rounded-full bg-[var(--brand-500)] flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-lg">K</span>
          </div>
          <h1 className="text-lg font-medium text-[var(--fg)]">Sign Up</h1>
          <p className="text-xs text-[var(--fg4)] mt-1">Join the conversation</p>
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
            <label className="block text-xs font-bold text-[var(--fg2)] mb-1.5 uppercase tracking-wide">Username</label>
            <div className="relative">
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Choose a username" required autoComplete="username"
                className="w-full h-11 px-3 pr-10 text-sm rounded border bg-[var(--bg)] border-[var(--border)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-500)] transition-all hover:border-[var(--border-strong)]" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">{getUsernameIcon()}</div>
            </div>
            {usernameStatus === 'taken' && <p className="text-xs text-red-500 mt-1">This username is already taken</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--fg2)] mb-1.5 uppercase tracking-wide">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required autoComplete="email"
              className="w-full h-11 px-3 text-sm rounded border bg-[var(--bg)] border-[var(--border)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-500)] transition-all hover:border-[var(--border-strong)]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--fg2)] mb-1.5 uppercase tracking-wide">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min 6 characters)" required minLength={6} autoComplete="new-password"
              className="w-full h-11 px-3 text-sm rounded border bg-[var(--bg)] border-[var(--border)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-500)] transition-all hover:border-[var(--border-strong)]" />
          </div>
          <button type="submit" disabled={loading || usernameStatus === 'taken' || usernameStatus === 'checking'} className="kura-btn w-full bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)] disabled:opacity-50 py-2.5">
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-[var(--fg4)]">
          Already a member? <Link href="/login" className="text-[var(--brand-500)] font-bold hover:underline">Log In</Link>
        </p>
      </div>
    </div>
  );
}
