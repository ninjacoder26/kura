'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import PostCard from '@/components/post/PostCard';
import CommunityCard from '@/components/community/CommunityCard';
import { Search as SearchIcon, Users, FileText, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'posts', label: 'Posts', icon: FileText },
  { key: 'communities', label: 'Communities', icon: Users },
  { key: 'trending', label: 'Trending', icon: TrendingUp },
];

const MOCK_RESULTS = {
  posts: [
    {
      id: '1',
      title: 'Best laptop for programming under 1 lakh in Nepal?',
      body: 'Looking for recommendations...',
      author: { username: 'cs_student', display_name: 'CS Student' },
      community: { name: 'Nepali Tech', slug: 'nepali-tech', color: '#10b981' },
      upvotes: 89,
      downvotes: 3,
      comment_count: 34,
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      title: 'Why is internet so expensive in Nepal compared to India?',
      body: 'Serious question...',
      author: { username: 'netizen_np', display_name: 'Netizen' },
      community: { name: 'Nepali Tech', slug: 'nepali-tech', color: '#10b981' },
      upvotes: 234,
      downvotes: 12,
      comment_count: 89,
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
  ],
  communities: [
    { name: 'Nepali Tech', slug: 'nepali-tech', description: 'Technology discussions', color: '#10b981', member_count: 1820, post_count: 345, category: 'technology' },
    { name: 'Kathmandu', slug: 'kathmandu', description: 'The valley', color: '#6366f1', member_count: 2340, post_count: 567, category: 'cities' },
  ],
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const hasQuery = query.length > 0;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Search bar */}
        <div className="mb-6 animate-fade-in">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts, communities, people..."
              className="w-full h-12 pl-12 pr-4 text-base rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* Tabs */}
        {hasQuery && (
          <div className="flex items-center gap-1 border-b border-[var(--color-border)] mb-6 animate-fade-in">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                    activeTab === tab.key
                      ? 'border-[var(--color-brand-600)] text-[var(--color-brand-600)]'
                      : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Results */}
        {!hasQuery ? (
          <div className="py-16 text-center animate-fade-in">
            <div className="h-16 w-16 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center mx-auto mb-4">
              <SearchIcon className="h-8 w-8 text-[var(--color-text-muted)]" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">
              Explore Kura
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] max-w-sm mx-auto">
              Search for posts, communities, or topics that interest you.
              From Kathmandu to Pokhara, from tech to food — find your people.
            </p>
          </div>
        ) : (
          <div className="animate-fade-in">
            {activeTab === 'posts' && (
              <div className="space-y-4">
                {MOCK_RESULTS.posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}

            {activeTab === 'communities' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MOCK_RESULTS.communities.map((c) => (
                  <CommunityCard key={c.slug} community={c} />
                ))}
              </div>
            )}

            {activeTab === 'trending' && (
              <div className="py-16 text-center">
                <p className="text-sm text-[var(--color-text-muted)]">
                  Trending results will appear here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      <MobileNav />
    </div>
  );
}
