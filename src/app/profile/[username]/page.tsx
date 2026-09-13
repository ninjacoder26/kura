'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import PostList from '@/components/post/PostList';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import { MapPin, Calendar, Link as LinkIcon, MessageSquare, ArrowBigUp } from 'lucide-react';

const MOCK_PROFILE = {
  username: 'wanderer_np',
  display_name: 'Wanderer',
  bio: 'Travel enthusiast | Photography lover | Exploring Nepal one trail at a time',
  location: 'Kathmandu, Nepal',
  website: 'https://wanderer.com.np',
  created_at: '2024-01-10',
  post_count: 45,
  comment_count: 234,
  reputation: 1567,
  communities: [
    { slug: 'travel-nepal', name: 'Travel Nepal', color: '#10b981' },
    { slug: 'kathmandu', name: 'Kathmandu', color: '#6366f1' },
    { slug: 'nepal-food', name: 'Nepal Food', color: '#ef4444' },
  ],
};

const MOCK_POSTS = [
  {
    id: '1',
    title: 'What are the best places to visit in Pokhara during Dashain?',
    body: 'Planning a trip to Pokhara with family during Dashain this year...',
    author: { username: 'wanderer_np', display_name: 'Wanderer' },
    community: { name: 'Travel Nepal', slug: 'travel-nepal', color: '#10b981' },
    upvotes: 234,
    downvotes: 12,
    comment_count: 67,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    title: 'Best momo spots in Kathmandu — let\'s settle this once and for all',
    body: 'Every neighborhood claims to have the best momos...',
    author: { username: 'wanderer_np', display_name: 'Wanderer' },
    community: { name: 'Nepal Food', slug: 'nepal-food', color: '#ef4444' },
    upvotes: 423,
    downvotes: 45,
    comment_count: 231,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
];

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'communities'>('posts');
  const profile = MOCK_PROFILE;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Profile header */}
        <Card className="mb-6 animate-fade-in overflow-hidden">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-[var(--color-brand-400)] to-[var(--color-brand-600)] relative">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
          </div>

          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-10">
              <Avatar
                name={profile.display_name || profile.username}
                size="xl"
                className="border-4 border-[var(--color-bg)]"
              />
              <div className="flex-1 min-w-0 pb-1">
                <h1 className="text-xl font-bold text-[var(--color-text)]">
                  {profile.display_name}
                </h1>
                <p className="text-sm text-[var(--color-text-muted)]">u/{profile.username}</p>
              </div>
              <Button variant="secondary" size="sm">
                Edit Profile
              </Button>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
                {profile.bio}
              </p>
            )}

            {/* Meta */}
            <div className="flex items-center gap-4 mt-3 text-xs text-[var(--color-text-muted)]">
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {profile.location}
                </span>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-[var(--color-brand-600)]"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  {profile.website.replace(/https?:\/\//, '')}
                </a>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[var(--color-border)]">
              <div className="text-center">
                <p className="text-lg font-bold text-[var(--color-text)]">{profile.post_count}</p>
                <p className="text-xs text-[var(--color-text-muted)]">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-[var(--color-text)]">{profile.comment_count}</p>
                <p className="text-xs text-[var(--color-text-muted)]">Comments</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-[var(--color-brand-600)]">{profile.reputation.toLocaleString()}</p>
                <p className="text-xs text-[var(--color-text-muted)]">Karma</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Communities */}
        <div className="mb-6 animate-fade-in">
          <h2 className="text-sm font-semibold text-[var(--color-text)] mb-3">Communities</h2>
          <div className="flex flex-wrap gap-2">
            {profile.communities.map((c) => (
              <Link
                key={c.slug}
                href={`/r/${c.slug}`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-full)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] transition-colors text-sm"
              >
                <div
                  className="h-5 w-5 rounded-sm flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: c.color }}
                >
                  {c.name.charAt(0)}
                </div>
                r/{c.slug}
              </Link>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-[var(--color-border)] mb-4 animate-fade-in">
          {[
            { key: 'posts' as const, label: 'Posts', icon: ArrowBigUp },
            { key: 'comments' as const, label: 'Comments', icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-[var(--color-brand-600)] text-[var(--color-brand-600)]'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'posts' && (
          <PostList posts={MOCK_POSTS} emptyMessage="No posts yet." />
        )}

        {activeTab === 'comments' && (
          <div className="py-16 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">Comments coming soon.</p>
          </div>
        )}
      </div>
      <MobileNav />
    </div>
  );
}
