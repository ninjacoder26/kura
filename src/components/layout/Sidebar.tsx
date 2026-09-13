'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Compass, Settings, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/communities', label: 'Communities', icon: Users },
  { href: '/search', label: 'Explore', icon: Compass },
  { href: '/setup', label: 'Setup', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block w-56 xl:w-64 shrink-0">
      <div className="sticky top-[72px] space-y-1 pb-8 pr-2">
        {NAV.map(item => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-[var(--r-md)] text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-[var(--brand-50)] text-[var(--brand-600)] dark:bg-[color-mix(in_srgb,var(--brand-600)_12%,transparent)] dark:text-[var(--brand-400)]'
                  : 'text-[var(--fg2)] hover:bg-[var(--bg-raised)] hover:text-[var(--fg)]'
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-[var(--border)]">
          <p className="px-3 text-[11px] font-medium uppercase tracking-wider text-[var(--fg4)] mb-2">Resources</p>
          <a
            href="https://github.com/ninjacoder26/kura"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--fg3)] hover:text-[var(--fg)] hover:bg-[var(--bg-raised)] rounded-[var(--r-md)] transition-colors"
          >
            GitHub <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="px-3 pt-6 text-[11px] text-[var(--fg4)] space-y-0.5">
          <p>Kura v0.1.0</p>
          <p>Nepal, talking.</p>
        </div>
      </div>
    </aside>
  );
}
