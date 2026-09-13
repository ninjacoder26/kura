import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import PostList from '@/components/post/PostList';
import CommunityCard from '@/components/community/CommunityCard';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import { TrendingUp, Sparkles, MapPin, GraduationCap, Zap } from 'lucide-react';

// Mock data — replace with real Supabase queries
const MOCK_POSTS = [
  {
    id: '1',
    title: 'What are the best places to visit in Pokhara during Dashain?',
    body: 'Planning a trip to Pokhara with family during Dashain this year. Looking for recommendations on restaurants, activities, and must-visit spots. Budget is moderate.',
    author: { username: 'wanderer_np', display_name: 'Wanderer' },
    community: { name: 'Travel Nepal', slug: 'travel-nepal', color: '#10b981' },
    upvotes: 234,
    downvotes: 12,
    comment_count: 67,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    title: 'TU Computer Engineering syllabus is outdated — what changes would you make?',
    body: 'The current curriculum at Tribhuvan University focuses heavily on theory and doesn\'t cover modern frameworks, cloud computing, or DevOps. If you could redesign the syllabus, what would you include?',
    author: { username: 'cs_student_42', display_name: 'CS Student' },
    community: { name: 'TU Students', slug: 'tu-students', color: '#f59e0b' },
    upvotes: 189,
    downvotes: 23,
    comment_count: 143,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: 'My journey from零 coding knowledge to landing a remote job in 8 months',
    body: 'I wanted to share my experience of learning to code from scratch and landing a remote frontend developer position. Here\'s what worked, what didn\'t, and the resources I used.',
    author: { username: 'self_taught_dev', display_name: 'Self-taught Dev' },
    community: { name: 'Nepali Tech', slug: 'nepali-tech', color: '#6366f1' },
    upvotes: 567,
    downvotes: 8,
    comment_count: 89,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    title: 'Best momo spots in Kathmandu — let\'s settle this once and for all',
    body: 'Every neighborhood claims to have the best momos. Here\'s my ranking after trying 50+ places across the valley. Fight me in the comments.',
    author: { username: 'foodie_ktm', display_name: 'Foodie KTM' },
    community: { name: 'Nepal Food', slug: 'nepal-food', color: '#ef4444' },
    upvotes: 423,
    downvotes: 45,
    comment_count: 231,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    title: 'Is it worth buying a gaming PC in Nepal right now or wait for prices to drop?',
    body: 'With import duties and everything, PCs are expensive here. I\'m thinking of building one for around 1.5 lakh. Is now a good time or should I wait?',
    author: { username: 'gamer_nepal', display_name: 'Gamer Nepal' },
    community: { name: 'Gaming Nepal', slug: 'gaming-nepal', color: '#8b5cf6' },
    upvotes: 87,
    downvotes: 11,
    comment_count: 56,
    created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
  },
];

const MOCK_COMMUNITIES = [
  { name: 'Kathmandu', slug: 'kathmandu', description: 'The valley and beyond', color: '#6366f1', member_count: 2340, post_count: 567, category: 'cities' },
  { name: 'Nepali Tech', slug: 'nepali-tech', description: 'Technology discussions from Nepal', color: '#10b981', member_count: 1820, post_count: 345, category: 'technology' },
  { name: 'TU Students', slug: 'tu-students', description: 'Tribhuvan University community', color: '#f59e0b', member_count: 3100, post_count: 890, category: 'universities' },
  { name: 'Nepal Food', slug: 'nepal-food', description: 'Food culture of Nepal', color: '#ef4444', member_count: 890, post_count: 234, category: 'food' },
  { name: 'Gaming Nepal', slug: 'gaming-nepal', description: 'Gamers of Nepal unite', color: '#8b5cf6', member_count: 1450, post_count: 456, category: 'gaming' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-6 flex gap-6">
        <Sidebar />

        <main className="flex-1 min-w-0 space-y-6">
          {/* Welcome banner */}
          <Card className="bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-brand-800)] border-0 text-white overflow-hidden relative">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-white translate-y-1/2 -translate-x-1/2" />
            </div>
            <div className="relative p-6">
              <h2 className="text-xl font-bold">Kura — Nepal, talking.</h2>
              <p className="text-sm text-white/80 mt-1 max-w-lg">
                Discover communities, share your thoughts, and connect with people across Nepal.
                From Kathmandu to Pokhara, from TU to every school — this is your space.
              </p>
              <div className="flex gap-3 mt-4">
                <Link href="/communities">
                  <Button className="bg-white text-[var(--color-brand-700)] hover:bg-white/90">
                    Browse Communities
                  </Button>
                </Link>
                <Link href="/submit">
                  <Button className="bg-white/10 text-white border border-white/20 hover:bg-white/20">
                    Create Post
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Feed tabs */}
          <div className="flex items-center gap-1 border-b border-[var(--color-border)]">
            {[
              { label: 'Popular', icon: TrendingUp },
              { label: 'New', icon: Sparkles },
              { label: 'Local', icon: MapPin },
            ].map((tab, i) => (
              <button
                key={tab.label}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  i === 0
                    ? 'border-[var(--color-brand-600)] text-[var(--color-brand-600)]'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Posts */}
          <PostList posts={MOCK_POSTS} />
        </main>

        {/* Right sidebar */}
        <aside className="hidden xl:block w-72 shrink-0">
          <div className="sticky top-[72px] space-y-4 pb-8">
            {/* Popular communities */}
            <Card>
              <h3 className="font-semibold text-sm text-[var(--color-text)] mb-3">
                Popular Communities
              </h3>
              <div className="space-y-3">
                {MOCK_COMMUNITIES.map((community, i) => (
                  <Link
                    key={community.slug}
                    href={`/r/${community.slug}`}
                    className="flex items-center gap-3 group"
                  >
                    <span className="text-xs font-medium text-[var(--color-text-muted)] w-4">
                      {i + 1}
                    </span>
                    <div
                      className="h-8 w-8 rounded-[var(--radius-sm)] flex items-center justify-center text-white font-bold text-xs shrink-0"
                      style={{ backgroundColor: community.color }}
                    >
                      {community.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--color-text)] group-hover:text-[var(--color-brand-600)] truncate">
                        r/{community.slug}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-muted)]">
                        {community.member_count.toLocaleString()} members
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                href="/communities"
                className="block mt-3 text-xs font-medium text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)]"
              >
                View all
              </Link>
            </Card>

            {/* Quick links */}
            <Card>
              <h3 className="font-semibold text-sm text-[var(--color-text)] mb-3">
                Quick Links
              </h3>
              <div className="space-y-2">
                {[
                  { href: '/submit', label: 'Create a post', icon: Sparkles },
                  { href: '/communities', label: 'Browse communities', icon: MapPin },
                  { href: '/search', label: 'Explore topics', icon: TrendingUp },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-brand-600)] transition-colors"
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </Card>

            {/* About */}
            <Card className="bg-[var(--color-bg-secondary)]">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-700)] flex items-center justify-center">
                  <span className="text-white font-bold text-[10px]">K</span>
                </div>
                <span className="font-semibold text-sm">About Kura</span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Kura is a community platform built for Nepal.
                Share ideas, discover communities, and connect with
                people across the country.
              </p>
              <Link
                href="/setup"
                className="inline-block mt-2 text-xs text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)]"
              >
                System status →
              </Link>
            </Card>
          </div>
        </aside>
      </div>

      <MobileNav />
    </div>
  );
}
