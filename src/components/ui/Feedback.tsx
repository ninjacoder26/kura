export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="h-14 w-14 rounded-2xl bg-[var(--bg-raised)] flex items-center justify-center mb-4 text-[var(--fg4)]">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[var(--fg)] mb-1">{title}</h3>
      {description && <p className="text-sm text-[var(--fg3)] max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="h-14 w-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
        <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-[var(--fg)] mb-1">Something went wrong</h3>
      <p className="text-sm text-[var(--fg3)] max-w-sm">{message || 'An unexpected error occurred.'}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 text-sm font-medium text-[var(--brand-600)] hover:underline">
          Try again
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className || ''}`} />;
}

export function CommunitySkeleton() {
  return (
    <div className="p-4 border border-[var(--border)] rounded-[var(--r-lg)] space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 sm:h-12 sm:w-12 rounded-[var(--r-md)]" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className="flex items-center justify-center py-12">
      <svg className={`animate-spin ${dims[size]} text-[var(--brand-600)]`} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}
