'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import PostList from '@/components/post/PostList';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { Users, Calendar, Shield, ChevronRight, Plus } from 'lucide-react';

// Mock data
const MOCK_COMMUNITY = {
  name: 'Nepali Tech',
  slug: 'nepali-tech',
  description: 'Technology discussions from Nepal. Software, hardware, startups, and everything tech.',
  long_description: 'A community for tech enthusiasts in Nepal. Discuss the latest in software development, hardware, startups, and digital innovation in Nepal and beyond.',
  color: '#10b981',
  member_count: 1820,
  post_count: 345,
  category: 'technology',
  created_at: '2024-01-15',
  rules: [
    'Be respectful and constructive',
    'No spam or self-promotion without context',
    'Use appropriate flairs',
    'Keep discussions relevant to tech in Nepal',
  ],
  moderators: [
    { username: 'tech_admin', display_name: 'Tech Admin' },
  ],
};

const MOCK_POSTS = [
  {
    id: '1',
    title: 'What tech stack do Nepali startups prefer in 2025?',
    body: 'I\'ve been noticing a shift towards Next.js and Go in the Kathmandu startup scene. What are you seeing?',
    author: { username: 'startup_watcher', display_name: 'Startup Watcher' },
    community: { name: 'Nepali Tech', slug: 'nepali-tech', color: '#10b981' },
    upvotes: 89,
    downvotes: 3,
    comment_count: 34,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    title: 'Free AWS certifications for Nepali students — how to apply',
    body: 'AWS is offering free certification vouchers for students in Nepal through their Academic Partnership program. Here\'s how to apply.',
    author: { username: 'cloud_guru', display_name: 'Cloud Guru' },
    community: { name: 'Nepali Tech', slug: 'nepali-tech', color: '#10b981' },
    upvotes: 234,
    downvotes: 5,
    comment_count: 67,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: 'Built a Nepali date converter — would love feedback',
    body: 'I built a web app that converts BS dates to AD and vice versa. It also handles Nepali time zones. Check it out and let me know what you think.',
    author: { username: 'nepali_dev', display_name: 'Nepali Dev' },
    community: { name: 'Nepali Tech', slug: 'nepali-tech', color: '#10b981' },
    upvotes: 156,
    downvotes: 2,
    comment_count: 45,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const [isMember, setIsMember] = useState(false);
  const community = MOCK_COMMUNITY;

  return (
    <div className="min-h-screen">
      <Header />

      {/* Community banner */}
      <div className="h-32 sm:h-48" style={{ backgroundColor: community.color }}>
        <div className="mx-auto max-w-4xl h-full px-4 flex items-end pb-4">
          {/* Banner content if needed */}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4">
        {/* Community header */}
        <div className="relative -mt-8 mb-6 animate-fade-in">
          <div className="flex items-end gap-4">
            <div
              className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl flex items-center justify-center text-white font-bold text-3xl border-4 border-[var(--color-bg)] shadow-lg shrink-0"
              style={{ backgroundColor: community.color }}
            >
              {community.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">
                {community.name}
              </h1>
              <p className="text-sm text-[var(--color-text-muted)]">r/{community.slug}</p>
            </div>
            <div className="flex items-center gap-2 pb-1">
              {isMember ? (
                <Button variant="secondary" onClick={() => setIsMember(false)}>
                  Joined
                </Button>
              ) : (
                <Button onClick={() => setIsMember(true)}>
                  Join Community
                </Button>
              )}
              <Link href={`/submit?community=${community.slug}`}>
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-4 text-sm text-[var(--color-text-secondary)]">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {community.member_count.toLocaleString()} members
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Created {new Date(community.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          {/* Description */}
          <p className="mt-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {community.description}
          </p>

          {/* Category */}
          <div className="mt-3">
            <Badge variant="brand">{community.category}</Badge>
          </div>
        </div>

        {/* Content */}
        <div className="flex gap-6 pb-16">
          <main className="flex-1 min-w-0">
            {/* Create post CTA */}
            <Link href={`/submit?community=${community.slug}`} className="block mb-4">
              <div className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] transition-colors cursor-pointer">
                <Avatar name="You" size="sm" />
                <span className="text-sm text-[var(--color-text-muted)]">Create a post in {community.name}...</span>
              </div>
            </Link>

            <PostList posts={MOCK_POSTS} />
          </main>

          {/* Sidebar info */}
          <aside className="hidden sm:block w-72 shrink-0">
            <div className="sticky top-[72px] space-y-4 pb-8">
              {/* About */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <h3 className="font-semibold text-sm text-[var(--color-text)] mb-2">About Community</h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {community.description}
                </p>
                <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-muted)]">Members</span>
                    <span className="font-medium text-[var(--color-text)]">{community.member_count.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-muted)]">Posts</span>
                    <span className="font-medium text-[var(--color-text)]">{community.post_count.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Rules */}
              {community.rules && (
                <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <h3 className="font-semibold text-sm text-[var(--color-text)] mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Community Rules
                  </h3>
                  <ol className="space-y-2">
                    {community.rules.map((rule, i) => (
                      <li key={i} className="flex gap-2 text-sm text-[var(--color-text-secondary)]">
                        <span className="flex-shrink-0 font-medium text-[var(--color-text-muted)]">{i + 1}.</span>
                        {rule}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Moderators */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <h3 className="font-semibold text-sm text-[var(--color-text)] mb-3">Moderators</h3>
                <div className="space-y-2">
                  {community.moderators.map((mod) => (
                    <Link
                      key={mod.username}
                      href={`/profile/${mod.username}`}
                      className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-brand-600)]"
                    >
                      <Avatar name={mod.display_name || mod.username} size="xs" />
                      u/{mod.username}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <MobileNav />
    </div>
  );
}
