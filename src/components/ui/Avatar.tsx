import { useState } from 'react';
import { cn, getInitials } from '@/lib/utils';
import { optimizeImageUrl } from '@/lib/cloudinary';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const dims: Record<string, string> = {
  xs: 'h-5 w-5 text-[8px]',
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-16 w-16 text-lg',
};

export default function Avatar({ src, alt, name, size = 'md', className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <img
        src={optimizeImageUrl(src, { width: 128 })}
        alt={alt || name}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={cn('rounded-full object-cover shrink-0', dims[size], className)}
      />
    );
  }
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white shrink-0',
        'bg-gradient-to-br from-[var(--brand-400)] to-[var(--brand-700)]',
        dims[size], className
      )}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
