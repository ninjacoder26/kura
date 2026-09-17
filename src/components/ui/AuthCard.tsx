import type { ReactNode } from 'react';

interface AuthCardProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/** Reddit-style centered auth panel: logo, heading, content card, footer. */
export default function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm anim-fade-up">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-[var(--shadow-md)]">
          <div className="text-center mb-6">
            <div className="h-11 w-11 rounded-full bg-[var(--brand-500)] flex items-center justify-center mx-auto mb-3 shadow-sm">
              <span className="text-white font-bold text-xl">K</span>
            </div>
            <h1 className="text-xl font-bold text-[var(--fg)]">{title}</h1>
            {subtitle && <p className="text-xs text-[var(--fg4)] mt-1.5">{subtitle}</p>}
          </div>
          {children}
        </div>
        {footer && (
          <p className="mt-4 text-center text-xs text-[var(--fg4)]">{footer}</p>
        )}
      </div>
    </div>
  );
}
