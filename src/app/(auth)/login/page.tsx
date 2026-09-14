'use client';

import Link from 'next/link';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/providers/ToastProvider';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const redirectTo = searchParams.get('redirect') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    router.refresh();
  }

  return (
    <div className="min-h-[calc(100vh-48px)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm anim-fade-up">
        <div className="text-center mb-6">
          <div className="h-10 w-10 rounded-full bg-[var(--brand-600)] flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-lg">K</span>
          </div>
          <h1 className="text-lg font-medium text-[var(--fg)]">Log In</h1>
          <p className="text-xs text-[var(--fg4)] mt-1">Welcome back to Kura</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <div className="p-3 rounded text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">{error}</div>}
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required autoComplete="email" />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required autoComplete="current-password" />
          <button type="submit" disabled={loading} className="reddit-btn w-full bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] disabled:opacity-50">
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-[var(--fg4)]">
          New to Kura? <Link href="/signup" className="text-[var(--brand-600)] font-bold hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-48px)] flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand-600)] border-t-transparent" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
