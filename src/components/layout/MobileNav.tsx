'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Plus, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/AuthProvider';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/communities', label: 'Communities', icon: Users },
  { href: '/submit', label: 'Post', icon: Plus, accent: true },
  { href: '/search', label: 'Explore', icon: Compass },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    ...NAV_ITEMS,
    { href: user ? `/profile/${user.username}` : '/login', label: 'Profile', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-[var(--border)] bg-[var(--surface)] safe-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-[52px] py-1 transition-colors rounded-lg',
                item.accent
                  ? 'text-[var(--brand-500)]'
                  : active ? 'text-[var(--brand-500)]' : 'text-[var(--fg4)]'
              )}
            >
              {item.accent ? (
                <div className="h-10 w-10 -mt-4 rounded-full bg-[var(--brand-500)] flex items-center justify-center shadow-lg ring-4 ring-[var(--surface)]">
                  <Icon className="h-5 w-5 text-white" />
                </div>
              ) : (
                <Icon className="h-6 w-6" />
              )}
              <span className="text-[10px] font-semibold leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
