'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Search, Menu, Plus, Bell, Sun, Moon, X, ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { useTheme } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/utils';

export default function Header() {
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Mock auth state — replace with real auth
  const user = null as { username: string; display_name?: string; avatar_url?: string } | null;

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="h-8 w-8 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-700)] flex items-center justify-center">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="font-bold text-lg tracking-tight hidden sm:block">
            kura
          </span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-xl mx-auto hidden sm:block">
          <div
            className={cn(
              'relative flex items-center h-9 rounded-[var(--radius-full)] border transition-all duration-200',
              searchFocused
                ? 'border-[var(--color-brand-500)] ring-1 ring-[var(--color-brand-500)] bg-[var(--color-bg)]'
                : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-border-strong)]'
            )}
          >
            <Search className="h-4 w-4 ml-3 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search communities, posts..."
              className="flex-1 bg-transparent border-none outline-none px-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Link href="/submit">
            <Button variant="ghost" size="sm" className="hidden sm:flex gap-1.5">
              <Plus className="h-4 w-4" />
              <span>Create</span>
            </Button>
            <Button variant="ghost" size="sm" className="sm:hidden p-2">
              <Plus className="h-5 w-5" />
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {user ? (
            <>
              <Button variant="ghost" size="sm" className="p-2 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
              </Button>
              <Link href={`/profile/${user.username}`}>
                <Avatar name={user.display_name || user.username} src={user.avatar_url} size="sm" />
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/signup" className="hidden sm:block">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="p-2 sm:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile search */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-[var(--color-border)] px-4 py-3 animate-slide-down">
          <div className="relative flex items-center h-9 rounded-[var(--radius-full)] border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
            <Search className="h-4 w-4 ml-3 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search..."
              className="flex-1 bg-transparent border-none outline-none px-2 text-sm"
            />
          </div>
          <nav className="mt-3 space-y-1">
            {[
              { href: '/', label: 'Home' },
              { href: '/communities', label: 'Communities' },
              { href: '/submit', label: 'Create Post' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'block px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-[var(--color-brand-50)] text-[var(--color-brand-600)] dark:bg-[var(--color-brand-900)]/30 dark:text-[var(--color-brand-400)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
