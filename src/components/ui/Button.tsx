import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] active:bg-[var(--brand-800)] shadow-sm',
  secondary: 'bg-[var(--bg-raised)] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--border)]',
  ghost: 'text-[var(--fg2)] hover:bg-[var(--bg-raised)] hover:text-[var(--fg)]',
  danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm',
};

const sizes: Record<Size, string> = {
  xs: 'h-7 px-2 text-xs gap-1 rounded-[var(--r-sm)]',
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-[var(--r-sm)]',
  md: 'h-10 px-4 text-sm gap-2 rounded-[var(--r-md)]',
  lg: 'h-12 px-6 text-base gap-2 rounded-[var(--r-md)]',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-500)] focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        'active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-0.5 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
);
Button.displayName = 'Button';
export default Button;
