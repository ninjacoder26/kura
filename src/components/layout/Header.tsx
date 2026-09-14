'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Search, Plus, Sun, Moon, LogOut, User, ChevronDown } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { cn } from '@/lib/utils';

export default function Header() {
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
      <div className="flex items-center h-full px-3 gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="h-8 w-8 rounded-full bg-[var(--brand-600)] flex items-center justify-center">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="font-bold text-base tracking-tight hidden md:block text-[var(--fg)]">kura</span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-[580px] mx-auto hidden sm:block">
          <Link href="/search">
            <div className="flex items-center h-9 px-3 rounded-full bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--surface)] transition-all cursor-text">
              <Search className="h-3.5 w-3.5 mr-2 text-[var(--fg4)] shrink-0" />
              <span className="text-[13px] text-[var(--fg4)]">Search Kura</span>
            </div>
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Link href="/submit" className="hidden sm:block">
            <button className="reddit-btn bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] text-xs py-1.5 px-3">
              <Plus className="h-3.5 w-3.5" /> Create
            </button>
          </Link>
          <Link href="/submit" className="sm:hidden">
            <button className="vote-btn"><Plus className="h-5 w-5" /></button>
          </Link>

          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="vote-btn"
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {loading ? (
            <div className="h-7 w-7 rounded bg-[var(--bg-raised)] animate-pulse" />
          ) : user ? (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1.5 p-1 rounded hover:bg-[var(--surface-hover)] transition-colors"
              >
                <div className="h-6 w-6 rounded bg-[var(--bg-raised)] flex items-center justify-center overflow-hidden border border-[var(--border)]">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[9px] font-bold text-[var(--fg3)]">{initials}</span>
                  )}
                </div>
                <ChevronDown className={cn('h-3 w-3 text-[var(--fg4)] transition-transform hidden sm:block', userMenuOpen && 'rotate-180')} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)] z-50 py-1 anim-scale-in">
                  <div className="px-2.5 py-1.5 border-b border-[var(--border)]">
                    <p className="text-[11px] text-[var(--fg4)]">Logged in as</p>
                    <p className="text-xs font-medium text-[var(--fg)] truncate">{user.username}</p>
                  </div>
                  <Link
                    href={`/profile/${user.username}`}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-[var(--fg2)] hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <User className="h-3.5 w-3.5" /> Profile
                  </Link>
                  <button
                    onClick={async () => {
                      setUserMenuOpen(false);
                      await signOut();
                      router.push('/');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[var(--fg2)] hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link href="/login">
                <button className="reddit-btn border border-[var(--border)] text-[var(--fg2)] hover:border-[var(--border-strong)] bg-transparent text-xs py-1.5 px-3">
                  Log In
                </button>
              </Link>
              <Link href="/signup" className="hidden sm:block">
                <button className="reddit-btn bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] text-xs py-1.5 px-3">
                  Sign Up
                </button>
              </Link>
            </div>
          )}

          <Link href="/search" className="sm:hidden">
            <button className="vote-btn"><Search className="h-4 w-4" /></button>
          </Link>
        </div>
      </div>
    </header>
  );
}
