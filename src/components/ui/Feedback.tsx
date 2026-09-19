export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="h-12 w-12 rounded-full bg-[var(--bg-raised)] flex items-center justify-center mb-3 text-[var(--fg4)]">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-medium text-[var(--fg)] mb-1">{title}</h3>
      {description && <p className="text-xs text-[var(--fg3)] max-w-sm">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="h-12 w-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-3">
        <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-[var(--fg)] mb-1">Something went wrong</h3>
      <p className="text-xs text-[var(--fg3)] max-w-sm">{message || 'An unexpected error occurred.'}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 text-xs font-bold text-[var(--brand-500)] hover:underline">
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
    <div className="post-card flex items-center gap-3 p-3">
      <Skeleton className="h-12 w-12 rounded-full shrink-0" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-2.5 w-16" />
      </div>
    </div>
  );
}

export function PostSkeleton() {
  return (
    <div className="post-card flex">
      <div className="flex flex-col items-center gap-0.5 px-1 py-2 w-[36px] sm:w-[40px] shrink-0">
        <Skeleton className="h-6 w-6 rounded-md" />
        <Skeleton className="h-3 w-6" />
        <Skeleton className="h-6 w-6 rounded-md" />
      </div>
      <div className="flex-1 min-w-0 p-2.5 sm:p-3 space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-[18px] w-3/4" />
        <Skeleton className="h-3 w-full" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className="flex items-center justify-center py-12">
      <svg className={`animate-spin ${dims[size]} text-[var(--brand-500)]`} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}
