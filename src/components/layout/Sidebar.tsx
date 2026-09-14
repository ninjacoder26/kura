'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Compass, Settings, TrendingUp, Star, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/communities', label: 'Communities', icon: Users },
  { href: '/search', label: 'Explore', icon: Compass },
];

const RESOURCES = [
  { href: 'https://github.com/ninjacoder26/kura', label: 'GitHub', external: true },
  { href: '/setup', label: 'About', external: false },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block w-[var(--sidebar-w)] shrink-0">
      <div className="sticky top-[calc(var(--header-h)+12px)] space-y-4 pb-8 pr-4">
        {/* Main nav */}
        <div className="sidebar-widget">
          <nav className="py-1">
            {NAV.map(item => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-[var(--surface-hover)] text-[var(--brand-600)] font-medium'
                      : 'text-[var(--fg3)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Popular Communities widget */}
        <div className="sidebar-widget">
          <div className="sidebar-widget-header">Popular Communities</div>
          <div className="p-2">
            {['kathmandu', 'nepal', 'technology', 'gaming', 'culture'].map((slug, i) => (
              <Link
                key={slug}
                href={`/r/${slug}`}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded text-sm text-[var(--fg2)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[var(--brand-400)] to-[var(--brand-700)] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {slug[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--fg)] truncate">r/{slug}</p>
                  <p className="text-[10px] text-[var(--fg4)]">{(Math.floor(Math.random() * 50) + 1)}k members</p>
                </div>
              </Link>
            ))}
            <Link href="/communities" className="block px-2 py-1.5 text-xs font-bold text-[var(--brand-600)] hover:underline">
              See more
            </Link>
          </div>
        </div>

        {/* Home widget */}
        <div className="sidebar-widget">
          <div className="bg-gradient-to-b from-[var(--brand-500)] to-[var(--brand-700)] h-8" />
          <div className="p-3">
            <div className="flex items-center gap-2 -mt-5 mb-2">
              <div className="h-10 w-10 rounded-full bg-[var(--brand-600)] border-2 border-[var(--surface)] flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
            </div>
            <p className="text-sm font-medium text-[var(--fg)]">Home</p>
            <p className="text-xs text-[var(--fg3)] mt-1 leading-relaxed">
              Your personal Kura frontpage. Come here to check in with your favorite communities.
            </p>
            <div className="mt-3 space-y-2">
              <Link href="/submit">
                <button className="reddit-btn w-full bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)]">
                  Create Post
                </button>
              </Link>
              <Link href="/communities">
                <button className="reddit-btn w-full border border-[var(--brand-600)] text-[var(--brand-600)] hover:bg-[var(--brand-50)] bg-transparent">
                  Create Community
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer links */}
        <div className="px-2 text-[10px] text-[var(--fg4)] space-y-1">
          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            <Link href="/" className="hover:underline">Home</Link>
            <Link href="/communities" className="hover:underline">Communities</Link>
            <Link href="/setup" className="hover:underline">About</Link>
          </div>
          <p>Kura Inc. 2026. All rights reserved.</p>
        </div>
      </div>
    </aside>
  );
}
