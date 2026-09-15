'use client';

import Link from 'next/link';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/providers/ToastProvider';

function ForgotPasswordForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) { toast('error', error.message); setLoading(false); return; }
    setSent(true); setLoading(false);
  }

  if (sent) {
    return (
      <div className="min-h-[calc(100vh-48px)] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm text-center anim-fade-up">
          <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
            <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-lg font-medium text-[var(--fg)]">Check your email</h1>
          <p className="text-xs text-[var(--fg3)] mt-2">We sent a password reset link to <strong>{email}</strong>.</p>
          <Link href="/login" className="inline-block mt-4">
            <button className="kura-btn border border-[var(--border)] text-[var(--fg2)] hover:border-[var(--border-strong)] bg-transparent text-xs">Back to login</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-48px)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm anim-fade-up">
        <div className="text-center mb-6">
          <h1 className="text-lg font-medium text-[var(--fg)]">Reset Password</h1>
          <p className="text-xs text-[var(--fg4)] mt-1">Enter your email and we&apos;ll send you a reset link.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-[var(--fg2)] mb-1.5 uppercase tracking-wide">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required
              className="w-full h-10 px-3 text-sm rounded border bg-[var(--bg)] border-[var(--border)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-600)] transition-all hover:border-[var(--border-strong)]" />
          </div>
          <button type="submit" disabled={loading} className="kura-btn w-full bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] disabled:opacity-50 py-2.5">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-[var(--fg4)]">
          <Link href="/login" className="text-[var(--brand-600)] font-bold hover:underline">Back to Log In</Link>
        </p>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-48px)] flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand-600)] border-t-transparent" /></div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
