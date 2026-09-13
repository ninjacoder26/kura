'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import CommentThread from '@/components/comments/CommentThread';
import CommentForm from '@/components/comments/CommentForm';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, Bookmark, MoreHorizontal, Flag, ArrowLeft } from 'lucide-react';
import { cn, formatDate, formatNumber } from '@/lib/utils';

const MOCK_POST = {
  id: '1',
  title: 'What are the best places to visit in Pokhara during Dashain?',
  body: `Planning a trip to Pokhara with family during Dashain this year. Looking for recommendations on restaurants, activities, and must-visit spots. Budget is moderate.\n\nWe're a family of 4, including two kids (ages 8 and 12). We'll be there for about 5 days.\n\nThings we're interested in:\n- Good restaurants (Nepali and international food)\n- Activities suitable for kids\n- Lakeside area recommendations\n- Any Dashain-specific events or celebrations\n- Day trips from Pokhara\n\nBudget: Around Rs. 50,000 for the whole trip (excluding travel to Pokhara).\n\nAny tips from locals or previous visitors would be amazing!`,
  type: 'text',
  author: { username: 'wanderer_np', display_name: 'Wanderer' },
  community: { name: 'Travel Nepal', slug: 'travel-nepal', color: '#10b981' },
  upvotes: 234,
  downvotes: 12,
  comment_count: 67,
  created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
};

const MOCK_COMMENTS = [
  {
    id: 'c1',
    body: 'Lakeside is obviously the main area, but I\'d highly recommend visiting Sarangkot for sunrise. The view of the Annapurna range is breathtaking. During Dashain, there are usually some cultural programs happening at the lakeside area.',
    author: { username: 'pokhara_local', display_name: 'Pokhara Local' },
    upvotes: 45,
    downvotes: 2,
    depth: 0,
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    children: [
      {
        id: 'c1-1',
        body: 'Sarangkot sunrise is a must! Also, if you have kids, the World Peace Pagoda is a nice easy hike with great views.',
        author: { username: 'mountain_lover', display_name: 'Mountain Lover' },
        upvotes: 23,
        downvotes: 0,
        depth: 1,
        created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        children: [],
      },
    ],
  },
  {
    id: 'c2',
    body: 'For restaurants, check out:\n\n1. **Godfather\'s Pizza** — great for kids\n2. **Moondance Restaurant** — international food with lake views\n3. **Yangling** — authentic Nepali food, very affordable\n4. **Café Concerto** — good for breakfast\n\nDuring Dashain, some places might have reduced hours, so call ahead.',
    author: { username: 'foodie_pokhara', display_name: 'Foodie Pokhara' },
    upvotes: 67,
    downvotes: 3,
    depth: 0,
    created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    children: [
      {
        id: 'c2-1',
        body: 'Godfather\'s is great! Also adding **Higher Ground** — it\'s a bit hidden but the food and ambiance are excellent.',
        author: { username: 'nepal_traveler', display_name: 'Nepal Traveler' },
        upvotes: 12,
        downvotes: 1,
        depth: 1,
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        children: [],
      },
    ],
  },
  {
    id: 'c3',
    body: 'For day trips, I\'d recommend:\n- **Davis Falls** and **Gupteshwor Cave** (right next to each other)\n- **Lumbini** (if you can do a longer day trip)\n- **Bandipur** (beautiful traditional Newari town on the way back)\n\nWith kids, the boating on Phewa Lake is always a hit. You can rent a boat for around Rs. 500-800.',
    author: { username: 'adventure_kid', display_name: 'Adventure Kid' },
    upvotes: 34,
    downvotes: 1,
    depth: 0,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    children: [],
  },
];

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const post = MOCK_POST;
  const score = post.upvotes - post.downvotes + (vote === 'up' ? 1 : vote === 'down' ? -1 : 0);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Back button */}
        <Link
          href={post.community ? `/r/${post.community.slug}` : '/'}
          className="inline-flex items-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {post.community ? `r/${post.community.slug}` : 'home'}
        </Link>

        <article className="animate-fade-in">
          {/* Post header */}
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-3">
            {post.community && (
              <>
                <Link
                  href={`/r/${post.community.slug}`}
                  className="font-semibold text-[var(--color-text)] hover:underline"
                >
                  r/{post.community.slug}
                </Link>
                <span>·</span>
              </>
            )}
            <span>Posted by</span>
            <Link href={`/profile/${post.author.username}`} className="hover:underline">
              u/{post.author.username}
            </Link>
            <span>·</span>
            <time>{formatDate(post.created_at)}</time>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-[var(--color-text)] leading-tight">
            {post.title}
          </h1>

          {/* Body */}
          <div className="mt-4 prose text-[var(--color-text)] text-sm leading-relaxed whitespace-pre-wrap">
            {post.body}
          </div>

          {/* Vote bar */}
          <div className="flex items-center gap-1 mt-6 pt-4 border-t border-[var(--color-border)]">
            <div className="flex items-center gap-0.5 bg-[var(--color-bg-tertiary)] rounded-[var(--radius-full)] px-1">
              <button
                onClick={() => setVote(vote === 'up' ? null : 'up')}
                className={cn(
                  'p-1.5 rounded-full transition-colors',
                  vote === 'up'
                    ? 'text-[var(--color-brand-600)] bg-[var(--color-brand-50)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-brand-600)]'
                )}
              >
                <ArrowBigUp className="h-5 w-5" />
              </button>
              <span className={cn(
                'text-sm font-bold tabular-nums px-1',
                vote === 'up' && 'text-[var(--color-brand-600)]',
                vote === 'down' && 'text-red-500'
              )}>
                {formatNumber(score)}
              </span>
              <button
                onClick={() => setVote(vote === 'down' ? null : 'down')}
                className={cn(
                  'p-1.5 rounded-full transition-colors',
                  vote === 'down'
                    ? 'text-red-500 bg-red-50'
                    : 'text-[var(--color-text-muted)] hover:text-red-500'
                )}
              >
                <ArrowBigDown className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-1 ml-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)]">
                <MessageSquare className="h-4 w-4" />
                {formatNumber(post.comment_count)} comments
              </span>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-full)] text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                <Share2 className="h-4 w-4" />
                Share
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-full)] text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                <Bookmark className="h-4 w-4" />
                Save
              </button>
              <button className="p-1.5 rounded-[var(--radius-full)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        </article>

        {/* Comments */}
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-[var(--color-text)] mb-4">
            Comments ({MOCK_COMMENTS.length})
          </h2>

          {/* Comment form */}
          <div className="mb-6">
            <CommentForm onSubmit={(body) => console.log('Comment:', body)} />
          </div>

          {/* Comment thread */}
          <CommentThread comments={MOCK_COMMENTS} postId={post.id} />
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
