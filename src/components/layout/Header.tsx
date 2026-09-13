'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Search, Menu, Plus, Sun, Moon, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useTheme } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/utils';

export default function Header() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const user = null as { username: string; display_name?: string; avatar_url?: string } | null;

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 flex items-center gap-2 sm:gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 mr-1 sm:mr-2">
          <div className="h-8 w-8 rounded-[var(--r-sm)] bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-700)] flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="font-bold text-lg tracking-tight hidden sm:block">kura</span>
        </Link>

        {/* Search — hidden on very small screens */}
        <div className="flex-1 max-w-xl mx-auto hidden sm:block">
          <div className={cn(
            'flex items-center h-9 rounded-[var(--r-full)] border transition-all duration-200',
            searchFocused
              ? 'border-[var(--brand-500)] ring-1 ring-[var(--brand-500)] bg-[var(--bg)]'
              : 'border-[var(--border)] bg-[var(--bg-alt)] hover:border-[var(--border-strong)]'
          )}>
            <Search className="h-4 w-4 ml-3 text-[var(--fg4)]" />
            <input
              type="text"
              placeholder="Search kura..."
              className="flex-1 bg-transparent border-none outline-none px-2 text-sm text-[var(--fg)] placeholder:text-[var(--fg4)]"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Link href="/submit" className="hidden sm:block">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Create
            </Button>
          </Link>
          <Link href="/submit" className="sm:hidden">
            <Button variant="ghost" size="sm" className="p-2"><Plus className="h-5 w-5" /></Button>
          </Link>

          <Button
            variant="ghost" size="sm" className="p-2"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {user ? (
            <Link href={`/profile/${user.username}`}>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--brand-400)] to-[var(--brand-700)] flex items-center justify-center text-white text-xs font-semibold">
                {user.display_name?.[0] || user.username[0]}
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link href="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
              <Link href="/signup" className="hidden sm:block"><Button size="sm">Sign up</Button></Link>
            </div>
          )}

          {/* Mobile search toggle */}
          <Link href="/search" className="sm:hidden">
            <Button variant="ghost" size="sm" className="p-2"><Search className="h-5 w-5" /></Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
