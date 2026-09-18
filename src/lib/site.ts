/**
 * Canonical site URL helper.
 *
 * Auth redirects (OAuth, email links) must always land on ONE domain.
 * If NEXT_PUBLIC_SITE_URL is set (e.g. https://kurasocial.vercel.app),
 * it wins; otherwise we fall back to the current origin (local dev).
 * Mixing domains across login splits cookies/sessions and makes login
 * appear to "work only the second time".
 */
export function getSiteUrl(): string {
  const env = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '');
  if (env) return env;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}
