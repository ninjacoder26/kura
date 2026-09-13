'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Users, TrendingUp, Settings, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/communities', label: 'Communities', icon: Users },
  { href: '/search', label: 'Explore', icon: Compass },
];

const TRENDING_COMMUNITIES = [
  { slug: 'kathmandu', name: 'Kathmandu', members: 2340, color: '#6366f1' },
  { slug: 'nepali-tech', name: 'Nepali Tech', members: 1820, color: '#10b981' },
  { slug: 'tu-students', name: 'TU Students', members: 3100, color: '#f59e0b' },
  { slug: 'nepal-food', name: 'Nepal Food', members: 890, color: '#ef4444' },
  { slug: 'gaming-nepal', name: 'Gaming Nepal', members: 1450, color: '#8b5cf6' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-[72px] space-y-4 pb-8">
        {/* Navigation */}
        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-[var(--color-brand-50)] text-[var(--color-brand-600)] dark:bg-[var(--color-brand-900)]/20 dark:text-[var(--color-brand-400)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text)]'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Trending Communities */}
        <div>
          <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
            Trending in Nepal
          </h3>
          <div className="space-y-0.5">
            {TRENDING_COMMUNITIES.map((community) => (
              <Link
                key={community.slug}
                href={`/r/${community.slug}`}
                className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm transition-colors hover:bg-[var(--color-bg-tertiary)]"
              >
                <div
                  className="h-7 w-7 rounded-[var(--radius-sm)] flex items-center justify-center text-white font-bold text-[10px] shrink-0"
                  style={{ backgroundColor: community.color }}
                >
                  {community.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-[var(--color-text)] truncate">r/{community.slug}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    {community.members.toLocaleString()} members
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <Link
            href="/communities"
            className="block px-3 py-2 text-xs font-medium text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)]"
          >
            View all communities
          </Link>
        </div>

        {/* Footer links */}
        <div className="px-3 pt-4 border-t border-[var(--color-border)]">
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--color-text-muted)]">
            <span>About</span>
            <span>Terms</span>
            <span>Privacy</span>
            <span>Help</span>
          </div>
          <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
            Kura v0.1.0 &mdash; Nepal, talking.
          </p>
        </div>
      </div>
    </aside>
  );
}
