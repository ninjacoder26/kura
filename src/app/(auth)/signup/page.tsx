'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/providers/ToastProvider';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');

    if (username.length < 3) { setError('Username must be at least 3 characters'); setLoading(false); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError('Letters, numbers, and underscores only'); setLoading(false); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, full_name: username } },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        username,
        display_name: username,
        email,
      });
    }

    setSuccess(true); setLoading(false);
    toast('success', 'Account created! Check your email to confirm.');
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-48px)] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm text-center anim-fade-up">
          <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
            <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-lg font-medium text-[var(--fg)]">Check your email</h1>
          <p className="text-xs text-[var(--fg3)] mt-2">We sent a confirmation link to <strong>{email}</strong>.</p>
          <Link href="/login" className="inline-block mt-4">
            <button className="reddit-btn border border-[var(--border)] text-[var(--fg2)] hover:border-[var(--border-strong)] bg-transparent text-xs">Back to login</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-48px)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm anim-fade-up">
        <div className="text-center mb-6">
          <div className="h-10 w-10 rounded-full bg-[var(--brand-600)] flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-lg">K</span>
          </div>
          <h1 className="text-lg font-medium text-[var(--fg)]">Sign Up</h1>
          <p className="text-xs text-[var(--fg4)] mt-1">Join the conversation</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <div className="p-3 rounded text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">{error}</div>}
          <Input label="Username" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Choose a username" required autoComplete="username" />
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required autoComplete="email" />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min 6 characters)" required minLength={6} autoComplete="new-password" />
          <button type="submit" disabled={loading} className="reddit-btn w-full bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] disabled:opacity-50">
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-[var(--fg4)]">
          Already a member? <Link href="/login" className="text-[var(--brand-600)] font-bold hover:underline">Log In</Link>
        </p>
      </div>
    </div>
  );
}
