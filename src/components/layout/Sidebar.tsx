'use client';

import { usePathname } from 'next/navigation';
import { Home, Users, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/utils';
import { usePopularCommunities } from '@/lib/usePopularCommunities';
import { NavLink, usePendingHref } from '@/components/layout/NavProgress';

const NAV = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/communities', label: 'Communities', icon: Users },
  { href: '/search', label: 'Explore', icon: Compass },
];

export default function Sidebar() {
  const pathname = usePathname();
  const pending = usePendingHref();
  // Cached across navigations: renders synchronously, never flashes empty.
  const popular = usePopularCommunities(5);

  return (
    <nav className="space-y-4">
      {/* Navigation */}
      <div className="sidebar-widget">
        <div className="py-1.5">
          {NAV.map(item => {
            const Icon = item.icon;
            const active = pathname === item.href;
            const isPending = pending === item.href;
            return (
              <NavLink
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                  active || isPending
                    ? 'bg-[var(--surface-hover)] text-[var(--brand-500)] font-semibold'
                    : 'text-[var(--fg3)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
                {isPending && !active && (
                  <span className="ml-auto h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--brand-500)] border-t-transparent" />
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Popular Communities */}
      {popular.length > 0 && (
        <div className="sidebar-widget">
          <div className="sidebar-widget-header">Popular Communities</div>
          <div className="p-2">
            {popular.map((c, i) => {
              const isPending = pending === `/k/${c.slug}`;
              return (
                <NavLink
                  key={c.slug}
                  href={`/k/${c.slug}`}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--fg2)] hover:bg-[var(--surface-hover)] transition-colors group',
                    isPending && 'bg-[var(--surface-hover)]'
                  )}
                >
                  <span className="text-xs font-semibold text-[var(--fg4)] w-5 text-right">{i + 1}</span>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--brand-400)] to-[var(--brand-600)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {c.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--fg)] group-hover:underline truncate">k/{c.slug}</p>
                  </div>
                  {isPending ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--brand-500)] border-t-transparent shrink-0" />
                  ) : (
                    <span className="text-[11px] text-[var(--fg4)] shrink-0">{formatNumber(c.member_count)}</span>
                  )}
                </NavLink>
              );
            })}
            <NavLink href="/communities" className="flex items-center justify-center gap-1 px-3 py-2 mt-1 text-xs font-semibold text-[var(--brand-500)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors">
              See more
            </NavLink>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-[11px] text-[var(--fg4)] space-y-1.5 px-2">
        <div className="flex flex-wrap gap-x-2.5 gap-y-1">
          <NavLink href="/" className="hover:underline">Home</NavLink>
          <NavLink href="/communities" className="hover:underline">About</NavLink>
          <NavLink href="/terms" className="hover:underline">Terms</NavLink>
          <NavLink href="/privacy" className="hover:underline">Privacy</NavLink>
        </div>
        <p>Kura Inc. 2026. All rights reserved.</p>
      </div>
    </nav>
  );
}
