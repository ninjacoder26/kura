import { Crown, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  role?: string | null;
  className?: string;
  size?: 'sm' | 'md';
}

/** Yellow crown for admins, shield for moderators, nothing otherwise. */
export default function RoleBadge({ role, className, size = 'sm' }: RoleBadgeProps) {
  const icon = size === 'md' ? 'h-5 w-5' : 'h-3.5 w-3.5';
  if (role === 'admin') {
    return (
      <span title="Admin" aria-label="Admin" className={cn('inline-flex items-center shrink-0', className)}>
        <Crown className={cn(icon, 'text-[#FFB000]')} fill="currentColor" />
      </span>
    );
  }
  if (role === 'moderator') {
    return (
      <span title="Moderator" aria-label="Moderator" className={cn('inline-flex items-center shrink-0', className)}>
        <ShieldCheck className={cn(icon, 'text-[var(--brand-500)]')} />
      </span>
    );
  }
  return null;
}
