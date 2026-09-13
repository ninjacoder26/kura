'use client';

import Link from 'next/link';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
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
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({ email, password, options: { data: { username, full_name: username } } });
    if (authError) { setError(authError.message); setLoading(false); return; }
    setSuccess(true); setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm text-center anim-fade-up">
          <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--fg)]">Check your email</h1>
          <p className="text-sm text-[var(--fg3)] mt-2">We sent a confirmation link to <strong>{email}</strong>.</p>
          <Link href="/login" className="inline-block mt-5"><Button variant="secondary" size="sm">Back to login</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm anim-fade-up">
        <div className="text-center mb-6 sm:mb-8">
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-700)] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[var(--brand-600)]/20">
            <span className="text-white font-bold text-xl sm:text-2xl">K</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--fg)]">Join Kura</h1>
          <p className="text-sm text-[var(--fg3)] mt-1">Create an account, start talking</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {error && <div className="p-3 rounded-[var(--r-md)] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">{error}</div>}
          <Input label="Username" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="your_username" required autoComplete="username" />
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" required minLength={6} autoComplete="new-password" />
          <Button type="submit" className="w-full" disabled={loading} loading={loading}>Create account</Button>
        </form>
        <p className="mt-5 sm:mt-6 text-center text-sm text-[var(--fg3)]">
          Already have an account? <Link href="/login" className="font-medium text-[var(--brand-600)] hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
