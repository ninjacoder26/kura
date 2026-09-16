import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center anim-fade-up">
        <div className="h-16 w-16 rounded-full bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl font-bold text-[var(--fg4)]">404</span>
        </div>
        <h1 className="text-xl font-bold text-[var(--fg)] mb-2">Page not found</h1>
        <p className="text-sm text-[var(--fg3)] mb-4">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link href="/" className="kura-btn bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] text-sm">
          Back to Test
        </Link>
      </div>
    </div>
  );
}
