import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

export function PostSkeleton() {
  return (
    <div className="flex gap-3 p-4 border-b border-[var(--border)]">
      <div className="flex flex-col items-center gap-1.5 pt-1">
        <Skeleton className="h-6 w-6 rounded-[var(--r-xs)]" />
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-6 w-6 rounded-[var(--r-xs)]" />
      </div>
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-3 pt-1">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </div>
  );
}

export function CommunitySkeleton() {
  return (
    <div className="p-4 border border-[var(--border)] rounded-[var(--r-lg)] space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-[var(--r-md)]" />
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
