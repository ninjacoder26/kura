'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Kura] route error:', error.message);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center anim-fade-up">
        <div className="h-16 w-16 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-red-500">!</span>
        </div>
        <h1 className="text-xl font-bold text-[var(--fg)]">Something went wrong</h1>
        <p className="text-sm text-[var(--fg4)] mt-1.5 mb-5 max-w-sm">
          This section hit an unexpected error. Your data is safe — try again.
        </p>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={reset}
            className="kura-btn bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)] text-sm"
          >
            Try again
          </button>
          <Link href="/">
            <button className="kura-btn border border-[var(--border)] text-[var(--fg2)] hover:border-[var(--border-strong)] bg-transparent text-sm">
              Go home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
