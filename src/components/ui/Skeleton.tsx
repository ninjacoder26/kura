import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse-slow rounded-[var(--radius-md)] bg-[var(--color-bg-tertiary)]',
        className
      )}
    />
  );
}
