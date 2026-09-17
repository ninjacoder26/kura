'use client';

import Link from 'next/link';
import type { LinkProps } from 'next/link';
import { usePathname } from 'next/navigation';
import {
  useEffect,
  useSyncExternalStore,
  type AnchorHTMLAttributes,
  type MouseEvent,
} from 'react';

// Tiny external store tracking the href of an in-flight client navigation.
// Lets nav links highlight INSTANTLY on click instead of waiting for the
// (potentially slow) destination page to finish loading.
let pendingHref: string | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach(l => l());
}

export function markNavPending(href: string | null) {
  if (pendingHref === href) return;
  pendingHref = href;
  emit();
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getSnapshot() {
  return pendingHref;
}

export function usePendingHref() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function hrefToString(href: LinkProps['href']): string {
  if (typeof href === 'string') return href;
  return href.pathname ?? '/';
}

type NavLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> &
  LinkProps & {
    prefetch?: boolean;
  };

/** Drop-in replacement for next/link that marks navigation pending on click. */
export function NavLink({ href, prefetch = true, onClick, ...rest }: NavLinkProps) {
  const pathname = usePathname();
  const to = hrefToString(href);

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    // Same-page click: no navigation will happen, make sure nothing sticks.
    if (to === pathname) markNavPending(null);
    else markNavPending(to);
    onClick?.(e);
  }

  return <Link href={href} prefetch={prefetch} onClick={handleClick} {...rest} />;
}

/** Slim top progress bar shown while a client navigation is in flight. */
export default function NavProgress() {
  const pathname = usePathname();
  const pending = usePendingHref();

  // Navigation landed (or failed elsewhere) — clear the bar.
  useEffect(() => {
    markNavPending(null);
  }, [pathname]);

  // Safety net: never leave a stuck bar if something goes wrong.
  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => markNavPending(null), 3000);
    return () => clearTimeout(t);
  }, [pending]);

  if (!pending) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[70] h-0.5 pointer-events-none overflow-hidden">
      <div className="h-full w-1/4 bg-[var(--brand-500)] rounded-r-full nav-progress-slide" />
    </div>
  );
}
