'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Subtle route-change transition for page content. Keyed by pathname so
 * each navigation plays a quick, elegant fade — the persistent shell
 * (header/sidebar) is unaffected.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
