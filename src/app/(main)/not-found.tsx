import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center anim-fade-up">
        <div className="h-16 w-16 rounded-full bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-[var(--fg4)]">?</span>
        </div>
        <h1 className="text-xl font-bold text-[var(--fg)]">This page went missing</h1>
        <p className="text-sm text-[var(--fg4)] mt-1.5 mb-5">
          The page you&apos;re looking for doesn&apos;t exist or was removed.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Link href="/">
            <button className="kura-btn bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)] text-sm">
              Go home
            </button>
          </Link>
          <Link href="/communities">
            <button className="kura-btn border border-[var(--border)] text-[var(--fg2)] hover:border-[var(--border-strong)] bg-transparent text-sm">
              Browse communities
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
