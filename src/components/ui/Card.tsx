import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const pads = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' };

export default function Card({ children, className, hover = false, padding = 'md', ...props }: CardProps) {
  return (
    <div
      className={cn(
        'post-card',
        hover && 'hover:border-[var(--border-strong)] cursor-pointer',
        pads[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
