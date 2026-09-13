import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import CommunityCard from '@/components/community/CommunityCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Search, SlidersHorizontal } from 'lucide-react';

const MOCK_COMMUNITIES = [
  { name: 'Kathmandu', slug: 'kathmandu', description: 'The valley and beyond', color: '#6366f1', member_count: 2340, post_count: 567, category: 'cities' },
  { name: 'Nepali Tech', slug: 'nepali-tech', description: 'Technology discussions from Nepal', color: '#10b981', member_count: 1820, post_count: 345, category: 'technology' },
  { name: 'TU Students', slug: 'tu-students', description: 'Tribhuvan University community', color: '#f59e0b', member_count: 3100, post_count: 890, category: 'universities' },
  { name: 'Nepal Food', slug: 'nepal-food', description: 'Food culture of Nepal', color: '#ef4444', member_count: 890, post_count: 234, category: 'food' },
  { name: 'Gaming Nepal', slug: 'gaming-nepal', description: 'Gamers of Nepal unite', color: '#8b5cf6', member_count: 1450, post_count: 456, category: 'gaming' },
  { name: 'Pokhara', slug: 'pokhara', description: 'City of lakes', color: '#06b6d4', member_count: 980, post_count: 123, category: 'cities' },
  { name: 'Nepal Sports', slug: 'nepal-sports', description: 'Cricket, football & more', color: '#84cc16', member_count: 1560, post_count: 345, category: 'sports' },
  { name: 'Kathmandu University', slug: 'ku-students', description: 'KU community', color: '#f97316', member_count: 1230, post_count: 234, category: 'universities' },
  { name: 'Nepali Music', slug: 'nepali-music', description: 'Music from the Himalayas', color: '#ec4899', member_count: 670, post_count: 89, category: 'music' },
  { name: 'Nepal Business', slug: 'nepal-business', description: 'Entrepreneurship in Nepal', color: '#14b8a6', member_count: 430, post_count: 56, category: 'business' },
  { name: 'Hiking Nepal', slug: 'hiking-nepal', description: 'Trails and treks', color: '#22c55e', member_count: 2100, post_count: 456, category: 'travel' },
  { name: 'Nepal Art', slug: 'nepal-art', description: 'Art & creative culture', color: '#a855f7', member_count: 340, post_count: 67, category: 'arts' },
];

const CATEGORIES = ['all', 'cities', 'universities', 'technology', 'food', 'gaming', 'sports', 'music', 'business', 'travel', 'arts'];

export default function CommunitiesPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-6 flex gap-6">
        <Sidebar />

        <main className="flex-1 min-w-0">
          <div className="mb-6 animate-fade-in">
            <h1 className="text-2xl font-bold text-[var(--color-text)]">Communities</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Find your people. Join communities that matter to you.
            </p>
          </div>

          {/* Search and filters */}
          <div className="flex items-center gap-3 mb-6 animate-fade-in">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Search communities..."
                className="w-full h-10 pl-10 pr-4 text-sm rounded-[var(--radius-full)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent"
              />
            </div>
            <Button variant="secondary" size="md">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 -mx-1 px-1 animate-fade-in">
            {CATEGORIES.map((cat, i) => (
              <button
                key={cat}
                className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius-full)] whitespace-nowrap transition-colors ${
                  i === 0
                    ? 'bg-[var(--color-brand-600)] text-white'
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Community grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {MOCK_COMMUNITIES.map((community) => (
              <CommunityCard key={community.slug} community={community} />
            ))}
          </div>

          {/* Create community CTA */}
          <div className="mt-8 text-center">
            <p className="text-sm text-[var(--color-text-muted)] mb-3">
              Can&apos;t find what you&apos;re looking for?
            </p>
            <Button variant="secondary">
              Create a Community
            </Button>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
