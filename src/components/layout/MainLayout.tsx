'use client';

import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';

interface MainLayoutProps {
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
}

export default function MainLayout({ children, rightSidebar }: MainLayoutProps) {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex px-4 py-3 gap-5">
        <aside className="hidden lg:block w-[228px] shrink-0">
          <div className="sticky top-12">
            <Sidebar />
          </div>
        </aside>
        <main className="flex-1 min-w-0">
          {children}
        </main>
        {rightSidebar && (
          <aside className="hidden xl:block w-[312px] shrink-0">
            <div className="sticky top-12 space-y-4">
              {rightSidebar}
            </div>
          </aside>
        )}
      </div>
      <MobileNav />
    </div>
  );
}
