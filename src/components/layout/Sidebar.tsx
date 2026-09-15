'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/communities', label: 'Communities', icon: Users },
  { href: '/search', label: 'Explore', icon: Compass },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="space-y-3">
      <div className="sidebar-widget">
        <div className="py-1">
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
        </div>
      </div>

      <div className="sidebar-widget">
        <div className="sidebar-widget-header">Popular Communities</div>
        <div className="p-2">
          {[
            { name: 'kathmandu', members: '24.5k' },
            { name: 'nepal', members: '89.2k' },
            { name: 'technology', members: '12.8k' },
            { name: 'gaming', members: '31.4k' },
            { name: 'culture', members: '8.7k' },
          ].map((c, i) => (
            <Link
              key={c.name}
              href={`/r/${c.name}`}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded text-sm text-[var(--fg2)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <span className="text-xs font-bold text-[var(--fg4)] w-4 text-right">{i + 1}</span>
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[var(--brand-400)] to-[var(--brand-700)] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {c.name[0].toUpperCase()}
              </div>
              <span className="text-xs font-medium text-[var(--fg)] truncate flex-1">r/{c.name}</span>
              <span className="text-[11px] text-[var(--fg4)]">{c.members}</span>
            </Link>
          ))}
          <Link href="/communities" className="block px-2 py-1.5 text-xs font-bold text-[var(--brand-600)] hover:underline">
            See more
          </Link>
        </div>
      </div>

      <div className="text-[11px] text-[var(--fg4)] space-y-1 px-1">
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/communities" className="hover:underline">About</Link>
          <Link href="/setup" className="hover:underline">Careers</Link>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <Link href="/setup" className="hover:underline">Help</Link>
          <Link href="/setup" className="hover:underline">Blog</Link>
          <Link href="/setup" className="hover:underline">Terms</Link>
          <Link href="/setup" className="hover:underline">Privacy</Link>
        </div>
        <p>Kura Inc. 2026. All rights reserved.</p>
      </div>
    </nav>
  );
}
