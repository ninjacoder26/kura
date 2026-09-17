import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import NavProgress from '@/components/layout/NavProgress';
import PageTransition from '@/components/layout/PageTransition';
import ShellWarmup from '@/components/layout/ShellWarmup';

// Shared shell for all main app pages. Header / MobileNav / NavProgress
// mount ONCE and persist across client-side navigation, so switching pages
// via the sidebar is instant — only the page content swaps out.
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <ShellWarmup />
      <NavProgress />
      <Header />
      <PageTransition>{children}</PageTransition>
      <MobileNav />
    </div>
  );
}
