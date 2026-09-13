'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Search, Plus, Sun, Moon, LogOut, User, ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { cn } from '@/lib/utils';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, loading, signOut } = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);
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
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 flex items-center gap-2 sm:gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 mr-1 sm:mr-2">
          <div className="h-8 w-8 rounded-[var(--r-sm)] bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-700)] flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="font-bold text-lg tracking-tight hidden sm:block">kura</span>
        </Link>

        {/* Search — desktop */}
        <div className="flex-1 max-w-xl mx-auto hidden sm:block">
          <Link href="/search">
            <div className={cn(
              'flex items-center h-9 rounded-[var(--r-full)] border transition-all duration-200 cursor-text',
              searchFocused
                ? 'border-[var(--brand-500)] ring-1 ring-[var(--brand-500)] bg-[var(--bg)]'
                : 'border-[var(--border)] bg-[var(--bg-alt)] hover:border-[var(--border-strong)]'
            )}>
              <Search className="h-4 w-4 ml-3 text-[var(--fg4)]" />
              <span className="flex-1 px-2 text-sm text-[var(--fg4)]">Search kura...</span>
            </div>
          </Link>
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

          {loading ? (
            <div className="h-8 w-8 rounded-full bg-[var(--bg-raised)] animate-pulse" />
          ) : user ? (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1.5 p-1 rounded-[var(--r-md)] hover:bg-[var(--bg-raised)] transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--brand-400)] to-[var(--brand-700)] flex items-center justify-center text-white text-xs font-semibold">
                  {initials}
                </div>
                <ChevronDown className={cn('h-3.5 w-3.5 text-[var(--fg4)] transition-transform hidden sm:block', userMenuOpen && 'rotate-180')} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)] z-50 py-1.5 anim-scale-in">
                  <div className="px-3 py-2 border-b border-[var(--border)]">
                    <p className="text-sm font-medium text-[var(--fg)] truncate">{user.display_name || user.username}</p>
                    <p className="text-xs text-[var(--fg4)] truncate">{user.email}</p>
                  </div>
                  <Link
                    href={`/profile/${user.username}`}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--fg2)] hover:bg-[var(--bg-raised)] hover:text-[var(--fg)] transition-colors"
                  >
                    <User className="h-4 w-4" /> Profile
                  </Link>
                  <button
                    onClick={async () => {
                      setUserMenuOpen(false);
                      await signOut();
                      router.push('/');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--fg2)] hover:bg-[var(--bg-raised)] hover:text-red-600 transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link href="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
              <Link href="/signup" className="hidden sm:block"><Button size="sm">Sign up</Button></Link>
            </div>
          )}

          {/* Mobile search */}
          <Link href="/search" className="sm:hidden">
            <Button variant="ghost" size="sm" className="p-2"><Search className="h-5 w-5" /></Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
