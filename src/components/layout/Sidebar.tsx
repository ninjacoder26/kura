'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatNumber } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/communities', label: 'Communities', icon: Users },
  { href: '/search', label: 'Explore', icon: Compass },
];

interface PopularCommunity {
  name: string;
  slug: string;
  member_count: number;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [popular, setPopular] = useState<PopularCommunity[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase.from('communities').select('name, slug, member_count').order('member_count', { ascending: false }).limit(5);
        if (data) setPopular(data as PopularCommunity[]);
      } catch {}
    }
    load();
  }, []);

  return (
    <nav className="space-y-4">
      {/* Navigation */}
      <div className="sidebar-widget">
        <div className="py-1.5">
          {NAV.map(item => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                  active
                    ? 'bg-[var(--surface-hover)] text-[var(--brand-500)] font-semibold'
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

      {/* Popular Communities */}
      {popular.length > 0 && (
        <div className="sidebar-widget">
          <div className="sidebar-widget-header">Popular Communities</div>
          <div className="p-2">
            {popular.map((c, i) => (
              <Link
                key={c.slug}
                href={`/k/${c.slug}`}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--fg2)] hover:bg-[var(--surface-hover)] transition-colors group"
              >
                <span className="text-xs font-semibold text-[var(--fg4)] w-5 text-right">{i + 1}</span>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--brand-400)] to-[var(--brand-600)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {c.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--fg)] group-hover:underline truncate">k/{c.slug}</p>
                </div>
                <span className="text-[11px] text-[var(--fg4)] shrink-0">{formatNumber(c.member_count)}</span>
              </Link>
            ))}
            <Link href="/communities" className="flex items-center justify-center gap-1 px-3 py-2 mt-1 text-xs font-semibold text-[var(--brand-500)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors">
              See more
            </Link>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-[11px] text-[var(--fg4)] space-y-1.5 px-2">
        <div className="flex flex-wrap gap-x-2.5 gap-y-1">
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/communities" className="hover:underline">About</Link>
          <Link href="/terms" className="hover:underline">Terms</Link>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
        </div>
        <p>Kura Inc. 2026. All rights reserved.</p>
      </div>
    </nav>
  );
}
