'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Search, Plus, Sun, Moon, LogOut, User, ChevronDown, Bell } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { cn } from '@/lib/utils';

export default function Header() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, loading, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const initials = user
    ? (user.display_name || user.username || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <header className="sticky top-0 z-50 bg-[var(--surface)] border-b border-[var(--border)]">
      <div className="h-[48px] flex items-center px-4 gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0 mr-2">
          <div className="h-8 w-8 rounded-full bg-[var(--brand-600)] flex items-center justify-center">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="font-bold text-lg tracking-tight hidden md:block text-[var(--fg)]">kura</span>
        </Link>

        <div className="flex-1 max-w-[690px] hidden sm:block">
          <Link href="/search">
            <div className="flex items-center h-10 px-4 rounded-full bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--surface)] transition-all cursor-text">
              <Search className="h-4 w-4 mr-2 text-[var(--fg4)] shrink-0" />
              <span className="text-sm text-[var(--fg4)]">Search Kura</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <Link href="/submit" className="hidden sm:block">
            <button className="kura-btn bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] text-sm py-1.5 px-4">
              <Plus className="h-4 w-4" /> Create
            </button>
          </Link>
          <Link href="/submit" className="sm:hidden">
            <button className="vote-btn"><Plus className="h-5 w-5" /></button>
          </Link>

          <div ref={notifRef} className="relative">
            <button onClick={() => setNotifOpen(!notifOpen)} className="vote-btn" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 rounded border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)] z-50 py-3 px-4 anim-scale-in">
                <p className="text-sm font-medium text-[var(--fg)] mb-2">Notifications</p>
                <p className="text-xs text-[var(--fg4)]">No notifications yet</p>
              </div>
            )}
          </div>

          <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} className="vote-btn" aria-label="Toggle theme">
            {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {loading ? (
            <div className="h-8 w-8 rounded bg-[var(--bg-raised)] animate-pulse" />
          ) : user ? (
            <div ref={menuRef} className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-1.5 p-1 rounded hover:bg-[var(--surface-hover)] transition-colors">
                <div className="h-8 w-8 rounded bg-[var(--bg-raised)] flex items-center justify-center overflow-hidden border border-[var(--border)]">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-[var(--fg3)]">{initials}</span>
                  )}
                </div>
                <ChevronDown className={cn('h-4 w-4 text-[var(--fg4)] transition-transform hidden sm:block', userMenuOpen && 'rotate-180')} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 rounded border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)] z-50 py-1 anim-scale-in">
                  <div className="px-3 py-2 border-b border-[var(--border)]">
                    <p className="text-[11px] text-[var(--fg4)]">Logged in as</p>
                    <p className="text-sm font-medium text-[var(--fg)] truncate">{user.username}</p>
                  </div>
                  <Link href={`/profile/${user.username}`} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--fg2)] hover:bg-[var(--surface-hover)] transition-colors">
                    <User className="h-4 w-4" /> Profile
                  </Link>
                  <button onClick={async () => { setUserMenuOpen(false); await signOut(); router.push('/'); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--fg2)] hover:bg-[var(--surface-hover)] transition-colors">
                    <LogOut className="h-4 w-4" /> Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <button className="kura-btn border border-[var(--border)] text-[var(--fg2)] hover:border-[var(--border-strong)] bg-transparent text-sm py-1.5 px-4">Log In</button>
              </Link>
              <Link href="/signup" className="hidden sm:block">
                <button className="kura-btn bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] text-sm py-1.5 px-4">Sign Up</button>
              </Link>
            </div>
          )}

          <Link href="/search" className="sm:hidden">
            <button className="vote-btn"><Search className="h-5 w-5" /></button>
          </Link>
        </div>
      </div>
    </header>
  );
}
