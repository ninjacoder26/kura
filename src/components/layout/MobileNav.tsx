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
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-[var(--border)] bg-[var(--surface)] safe-bottom">
      <div className="flex items-center justify-around h-11 max-w-lg mx-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-px min-w-[44px] py-0.5 transition-colors',
                item.accent
                  ? 'text-[var(--brand-600)]'
                  : active ? 'text-[var(--brand-600)]' : 'text-[var(--fg4)]'
              )}
            >
              {item.accent ? (
                <div className="h-7 w-7 -mt-2.5 rounded-full bg-[var(--brand-600)] flex items-center justify-center shadow">
                  <Icon className="h-4 w-4 text-white" />
                </div>
              ) : (
                <Icon className="h-5 w-5" />
              )}
              <span className="text-[9px] font-medium leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
