'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Plus, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/communities', label: 'Communities', icon: Users },
  { href: '/submit', label: 'Post', icon: Plus, accent: true },
  { href: '/search', label: 'Explore', icon: Compass },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-xl safe-bottom">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-2">
        {NAV.map(item => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-[48px] py-1 rounded-[var(--r-md)] transition-colors',
                item.accent
                  ? 'text-[var(--brand-600)]'
                  : active ? 'text-[var(--brand-600)]' : 'text-[var(--fg4)]'
              )}
            >
              {item.accent ? (
                <div className="h-10 w-10 -mt-5 rounded-full bg-[var(--brand-600)] flex items-center justify-center shadow-lg shadow-[var(--brand-600)]/30">
                  <Icon className="h-5 w-5 text-white" />
                </div>
              ) : (
                <Icon className="h-5 w-5" />
              )}
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
