'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Plus, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/communities', label: 'Communities', icon: Users },
  { href: '/submit', label: 'Create', icon: Plus, isAction: true },
  { href: '/search', label: 'Explore', icon: Compass },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-[var(--radius-md)] transition-colors min-w-[48px]',
                item.isAction
                  ? 'text-[var(--color-brand-600)]'
                  : isActive
                    ? 'text-[var(--color-brand-600)]'
                    : 'text-[var(--color-text-muted)]'
              )}
            >
              {item.isAction ? (
                <div className="h-10 w-10 -mt-5 rounded-full bg-[var(--color-brand-600)] flex items-center justify-center shadow-lg shadow-[var(--color-brand-600)]/30">
                  <Icon className="h-5 w-5 text-white" />
                </div>
              ) : (
                <Icon className="h-5 w-5" />
              )}
              <span className={cn(
                'text-[10px] font-medium',
                item.isAction && '-mt-0.5'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
