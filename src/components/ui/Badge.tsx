import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'brand' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
}

const variants = {
  default: 'bg-[var(--bg-raised)] text-[var(--fg2)]',
  brand: 'bg-[var(--brand-100)] text-[var(--brand-700)] dark:bg-[color-mix(in_srgb,var(--brand-600)_20%,transparent)] dark:text-[var(--brand-300)]',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-[color-mix(in_srgb,#10b981_20%,transparent)] dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-[color-mix(in_srgb,#f59e0b_20%,transparent)] dark:text-amber-300',
  danger: 'bg-red-100 text-red-700 dark:bg-[color-mix(in_srgb,#ef4444_20%,transparent)] dark:text-red-300',
};

const sizes = { sm: 'px-2 py-0.5 text-[10px]', md: 'px-2.5 py-1 text-xs' };

export default function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center font-bold rounded-full uppercase tracking-wide', sizes[size], variants[variant], className)}>
      {children}
    </span>
  );
}
