'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Plus, Sun, Moon, LogOut, User, ChevronDown, Bell, Settings } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { cn, formatNumber } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export default function Header() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, loading, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const loadNotifs = useCallback(async () => {
    if (!user) return;
    setNotifLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('notifications')
        .select('id, type, title, body, link, is_read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(15);
      if (data) setNotifs(data as NotificationItem[]);
    } catch {
      // Bell stays usable with an empty list on failure
    } finally {
      setNotifLoading(false);
    }
  }, [user]);

  // Keep the unread badge fresh for the session shell (mounts once).
  // Skips ticks while the tab is hidden — no wasted backend queries.
  useEffect(() => {
    if (!user) {
      setNotifs([]);
      return;
    }
    loadNotifs();
    const t = setInterval(() => {
      if (document.visibilityState !== 'hidden') loadNotifs();
    }, 60000);
    return () => clearInterval(t);
  }, [user, loadNotifs]);

  const unreadCount = notifs.filter(n => !n.is_read).length;

  async function markAllRead() {
    if (!user || unreadCount === 0) return;
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      const supabase = createClient();
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    } catch {}
  }

  async function openNotif(n: NotificationItem) {
    setNotifOpen(false);
    if (!n.is_read) {
      setNotifs(prev => prev.map(x => (x.id === n.id ? { ...x, is_read: true } : x)));
      try {
        const supabase = createClient();
        await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
      } catch {}
    }
    if (n.link) router.push(n.link);
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const initials = user
    ? (user.display_name || user.username || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <header className="sticky top-0 z-50 bg-[var(--surface)] border-b border-[var(--border)] shadow-[var(--shadow-xs)]">
      <div className="h-12 flex items-center px-3 sm:px-4 gap-3 sm:gap-4 w-full">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 mr-2">
          <div className="h-9 w-9 rounded-full bg-[var(--brand-500)] flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-base">K</span>
          </div>
          <span className="font-bold text-xl tracking-tight hidden md:block text-[var(--fg)]">kura</span>
        </Link>

        {/* Search — centered like Reddit */}
        <div className="flex-1 hidden sm:flex justify-center min-w-0 px-2">
          <Link href="/search" className="w-full max-w-[690px]">
            <div className="flex items-center h-10 px-4 rounded-full bg-[var(--surface-hover)] border border-[var(--border)] hover:border-[var(--brand-400)] hover:bg-[var(--surface)] transition-all cursor-text group">
              <Search className="h-4 w-4 mr-2.5 text-[var(--fg4)] group-hover:text-[var(--brand-500)] shrink-0 transition-colors" />
              <span className="text-sm text-[var(--fg4)]">Search Kura</span>
            </div>
          </Link>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {/* Create button */}
          <Link href="/submit" className="hidden sm:block">
            <button className="kura-btn bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)]">
              <Plus className="h-4 w-4" /> Create
            </button>
          </Link>
          <Link href="/submit" className="sm:hidden" aria-label="Create post">
            <button className="vote-btn icon-btn !w-9 !h-9" aria-label="Create post"><Plus className="h-5 w-5" /></button>
          </Link>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) loadNotifs(); }}
              className="vote-btn icon-btn !w-9 !h-9 relative"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[var(--accent-500)] text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)] z-50 anim-scale-in overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)]">
                  <p className="text-sm font-semibold text-[var(--fg)]">Notifications</p>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[11px] font-bold text-[var(--brand-500)] hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {notifLoading && notifs.length === 0 ? (
                    <div className="p-3 space-y-2">
                      {[1, 2, 3].map(i => <div key={i} className="h-12 rounded skeleton" />)}
                    </div>
                  ) : notifs.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <Bell className="h-8 w-8 text-[var(--fg4)] mx-auto mb-2 opacity-50" />
                      <p className="text-xs text-[var(--fg4)]">{user ? 'No notifications yet' : 'Log in to see notifications'}</p>
                    </div>
                  ) : (
                    notifs.map(n => (
                      <button
                        key={n.id}
                        onClick={() => openNotif(n)}
                        className={cn(
                          'w-full flex items-start gap-2.5 px-4 py-2.5 text-left border-b border-[var(--border)] last:border-0 transition-colors',
                          n.is_read ? 'hover:bg-[var(--surface-hover)]' : 'bg-[var(--brand-500)]/5 hover:bg-[var(--brand-500)]/10'
                        )}
                      >
                        <span className={cn('mt-1.5 h-2 w-2 rounded-full shrink-0', n.is_read ? 'bg-transparent' : 'bg-[var(--brand-500)]')} />
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold text-[var(--fg)] leading-snug">{n.title}</span>
                          {n.body && <span className="block text-[11px] text-[var(--fg4)] mt-0.5 line-clamp-2 break-words">{n.body}</span>}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} className="vote-btn icon-btn !w-9 !h-9" aria-label="Toggle theme" title="Toggle theme">
            {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* User menu / Auth buttons */}
          {loading ? (
            <div className="h-9 w-9 rounded-full bg-[var(--surface-hover)] animate-pulse" />
          ) : user ? (
            <div ref={menuRef} className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 p-1 rounded-lg hover:bg-[var(--surface-hover)] transition-colors">
                <div className="h-8 w-8 rounded-full bg-[var(--brand-500)] flex items-center justify-center overflow-hidden border-2 border-[var(--border)]">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[11px] font-bold text-white">{initials}</span>
                  )}
                </div>
                <ChevronDown className={cn('h-4 w-4 text-[var(--fg4)] transition-transform hidden sm:block', userMenuOpen && 'rotate-180')} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)] z-50 py-1 anim-scale-in">
                  <div className="px-4 py-3 border-b border-[var(--border)]">
                    <p className="text-[11px] text-[var(--fg4)] uppercase tracking-wide font-medium">Logged in as</p>
                    <p className="text-sm font-semibold text-[var(--fg)] truncate mt-0.5">@{user.username}</p>
                    <p className="text-[11px] text-[var(--fg4)] mt-0.5">{formatNumber(user.reputation ?? 0)} karma</p>
                  </div>
                  <Link href={`/profile/${user.username}`} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--fg2)] hover:bg-[var(--surface-hover)] transition-colors">
                    <User className="h-4 w-4" /> Profile
                  </Link>
                  <Link href="/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--fg2)] hover:bg-[var(--surface-hover)] transition-colors">
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                  <div className="border-t border-[var(--border)] my-1" />
                  <button onClick={async () => { setUserMenuOpen(false); await signOut(); router.push('/'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--fg2)] hover:bg-[var(--surface-hover)] transition-colors">
                    <LogOut className="h-4 w-4" /> Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <button className="kura-btn border border-[var(--border)] text-[var(--fg2)] hover:border-[var(--brand-400)] hover:text-[var(--brand-500)] bg-transparent">Log In</button>
              </Link>
              <Link href="/signup" className="hidden sm:block">
                <button className="kura-btn bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)]">Sign Up</button>
              </Link>
            </div>
          )}

          {/* Mobile search */}
          <Link href="/search" className="sm:hidden" aria-label="Search">
            <button className="vote-btn icon-btn !w-9 !h-9" aria-label="Search"><Search className="h-5 w-5" /></button>
          </Link>
        </div>
      </div>
    </header>
  );
}
