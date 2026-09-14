'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Search, Plus, Sun, Moon, LogOut, User, ChevronDown, Menu } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { cn } from '@/lib/utils';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, loading, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const initials = user
    ? (user.display_name || user.username || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <header className="sticky top-0 z-50 h-[var(--header-h)] bg-[var(--surface)] border-b border-[var(--border)]">
      <div className="flex items-center h-full px-4 gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="h-8 w-8 rounded-full bg-[var(--brand-600)] flex items-center justify-center">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="font-bold text-lg tracking-tight hidden md:block text-[var(--fg)]">kura</span>
        </Link>

        {/* Search — centered like Reddit */}
        <div className="flex-1 max-w-[600px] mx-auto hidden sm:block">
          <Link href="/search">
            <div className="flex items-center h-9 px-4 rounded-full bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--surface)] transition-all cursor-text">
              <Search className="h-4 w-4 mr-2 text-[var(--fg4)] shrink-0" />
              <span className="text-sm text-[var(--fg4)]">Search Kura</span>
            </div>
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/submit" className="hidden sm:block">
            <button className="reddit-btn bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)]">
              <Plus className="h-4 w-4" /> Create
            </button>
          </Link>
          <Link href="/submit" className="sm:hidden">
            <button className="reddit-btn bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] p-2">
              <Plus className="h-4 w-4" />
            </button>
          </Link>

          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="vote-btn"
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {loading ? (
            <div className="h-8 w-8 rounded-full bg-[var(--bg-raised)] animate-pulse" />
          ) : user ? (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 pr-2 rounded border border-transparent hover:border-[var(--border)] transition-colors"
              >
                <div className="h-6 w-6 rounded bg-[var(--bg-raised)] flex items-center justify-center overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-[var(--fg3)]">{initials}</span>
                  )}
                </div>
                <div className="hidden lg:flex flex-col items-start">
                  <span className="text-[11px] font-medium text-[var(--fg2)] leading-tight">{user.username}</span>
                </div>
                <ChevronDown className={cn('h-3.5 w-3.5 text-[var(--fg4)] transition-transform', userMenuOpen && 'rotate-180')} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 rounded border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)] z-50 py-1 anim-scale-in">
                  <div className="px-3 py-2 border-b border-[var(--border)]">
                    <p className="text-xs text-[var(--fg4)]">Logged in as</p>
                    <p className="text-sm font-medium text-[var(--fg)] truncate">{user.username}</p>
                  </div>
                  <Link
                    href={`/profile/${user.username}`}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--fg2)] hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <User className="h-4 w-4" /> Profile
                  </Link>
                  <button
                    onClick={async () => {
                      setUserMenuOpen(false);
                      await signOut();
                      router.push('/');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--fg2)] hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <button className="reddit-btn border border-[var(--border)] text-[var(--fg2)] hover:border-[var(--border-strong)] bg-transparent">
                  Log In
                </button>
              </Link>
              <Link href="/signup" className="hidden sm:block">
                <button className="reddit-btn bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)]">
                  Sign Up
                </button>
              </Link>
            </div>
          )}

          {/* Mobile search */}
          <Link href="/search" className="sm:hidden">
            <button className="vote-btn"><Search className="h-5 w-5" /></button>
          </Link>
        </div>
      </div>
    </header>
  );
}
