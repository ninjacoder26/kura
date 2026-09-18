'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { usePopularCommunities } from '@/lib/usePopularCommunities';

// Invisible shell helper, mounted once in the persistent layout:
// 1. Warms the popular-communities cache so sidebars render instantly.
// 2. Prefetches the two most likely next routes on idle. Kept to two on
//    purpose — every prefetch is a billed function invocation, and Next
//    already prefetches links as they scroll into view.
const PREFETCH_ROUTES = ['/', '/communities'];

export default function ShellWarmup() {
  const router = useRouter();
  usePopularCommunities(5);

  useEffect(() => {
    let cancelled = false;
    const warm = () => {
      if (cancelled) return;
      PREFETCH_ROUTES.forEach(r => {
        try {
          router.prefetch(r);
        } catch {}
      });
    };
    const w = window as any;
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(warm, { timeout: 3000 });
      return () => {
        cancelled = true;
        w.cancelIdleCallback?.(id);
      };
    }
    const t = setTimeout(warm, 1500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [router]);

  return null;
}
