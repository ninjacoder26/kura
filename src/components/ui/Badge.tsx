import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'brand' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
}

const variantClasses = {
  default: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]',
  brand: 'bg-[var(--color-brand-100)] text-[var(--color-brand-700)] dark:bg-[color-mix(in_srgb,var(--color-brand-600)_20%,transparent)] dark:text-[var(--color-brand-300)]',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-[color-mix(in_srgb,#10b981_20%,transparent)] dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-[color-mix(in_srgb,#f59e0b_20%,transparent)] dark:text-amber-300',
  danger: 'bg-red-100 text-red-700 dark:bg-[color-mix(in_srgb,#ef4444_20%,transparent)] dark:text-red-300',
};

export default function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-[var(--radius-full)]',
        {
          'px-2 py-0.5 text-[10px]': size === 'sm',
          'px-2.5 py-1 text-xs': size === 'md',
        },
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
