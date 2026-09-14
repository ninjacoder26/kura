'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import PostList from '@/components/post/PostList';
import type { PostData } from '@/components/post/PostCard';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { LoadingSpinner, EmptyState } from '@/components/ui/Feedback';
import { cn, formatDate } from '@/lib/utils';
import { MapPin, Calendar, Link as LinkIcon, ArrowBigUp, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface UserComment {
  id: string;
  body: string;
  post_id: string;
  post_title?: string;
  created_at: string;
}

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const [username, setUsername] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [comments, setComments] = useState<UserComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts');

  useEffect(() => { params.then(p => setUsername(p.username)); }, [params]);

  useEffect(() => {
    if (!username) return;
    async function load() {
      try {
        const supabase = createClient();
        const { data: prof } = await supabase.from('profiles').select('*').eq('username', username).single();
        setProfile(prof);

        if (prof) {
          const { data: postData } = await supabase
            .from('posts')
            .select('*, author:profiles!posts_author_id_fkey(username,display_name,avatar_url), community:communities!posts_community_id_fkey(name,slug,color)')
            .eq('author_id', prof.id)
            .eq('is_removed', false)
            .order('created_at', { ascending: false })
            .limit(20);

          if (postData) {
            setPosts((postData as any[]).map((p: any) => ({ ...p, author: p.author || { username: 'unknown' }, community: p.community || undefined })));
          }

          // Load user's comments
          const { data: commentData } = await supabase
            .from('comments')
            .select('id, body, post_id, created_at, posts!comments_post_id_fkey(title)')
            .eq('author_id', prof.id)
            .eq('is_removed', false)
            .order('created_at', { ascending: false })
            .limit(20);

          if (commentData) {
            setComments((commentData as any[]).map((c: any) => ({
              id: c.id,
              body: c.body,
              post_id: c.post_id,
              post_title: c.posts?.title,
              created_at: c.created_at,
            })));
          }
        }
      } catch {
        // not found
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [username]);

  if (loading) return <div className="min-h-screen"><Header /><LoadingSpinner /></div>;

  if (!profile) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <EmptyState title="User not found" description="This profile doesn't exist." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Profile header */}
        <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden mb-5 anim-fade-up">
          <div className="h-24 sm:h-32 bg-gradient-to-r from-[var(--brand-400)] to-[var(--brand-600)] relative">
            <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IndoaXRlIi8+PC9zdmc+')] [mask-image:linear-gradient(to_bottom,white_30%,transparent)]" />
          </div>
          <div className="px-4 sm:px-6 pb-5 sm:pb-6">
            <div className="flex items-end gap-3 sm:gap-4 -mt-8 sm:-mt-10">
              <Avatar name={profile.display_name || profile.username} size="xl" className="border-4 border-[var(--bg)]" />
              <div className="flex-1 min-w-0 pb-0.5">
                <h1 className="text-lg sm:text-xl font-bold text-[var(--fg)] truncate">{profile.display_name || profile.username}</h1>
                <p className="text-xs sm:text-sm text-[var(--fg4)]">u/{profile.username}</p>
              </div>
            </div>

            {profile.bio && <p className="mt-3 text-sm text-[var(--fg2)]">{profile.bio}</p>}

            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2.5 text-[11px] sm:text-xs text-[var(--fg4)]">
              {profile.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {profile.location}</span>}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-[var(--brand-600)]">
                  <LinkIcon className="h-3 w-3" /> {profile.website.replace(/https?:\/\//, '')}
                </a>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </div>

            <div className="flex items-center gap-5 mt-4 pt-3 border-t border-[var(--border)]">
              <div className="text-center"><p className="text-base sm:text-lg font-bold text-[var(--fg)]">{profile.post_count}</p><p className="text-[11px] text-[var(--fg4)]">Posts</p></div>
              <div className="text-center"><p className="text-base sm:text-lg font-bold text-[var(--fg)]">{profile.comment_count}</p><p className="text-[11px] text-[var(--fg4)]">Comments</p></div>
              <div className="text-center"><p className="text-base sm:text-lg font-bold text-[var(--brand-600)]">{(profile.reputation || 0).toLocaleString()}</p><p className="text-[11px] text-[var(--fg4)]">Karma</p></div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-[var(--border)] mb-4 anim-fade-up" style={{ animationDelay: '100ms' }}>
          {[
            { key: 'posts' as const, label: 'Posts', icon: ArrowBigUp },
            { key: 'comments' as const, label: 'Comments', icon: MessageSquare },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-[var(--brand-600)] text-[var(--brand-600)]'
                  : 'border-transparent text-[var(--fg4)] hover:text-[var(--fg3)]'
              )}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        <div className="pb-20 lg:pb-8">
          {activeTab === 'posts' && <PostList posts={posts} emptyTitle="No posts yet" emptyDescription="This user hasn't posted anything yet." />}
          {activeTab === 'comments' && (
            comments.length === 0 ? (
              <EmptyState title="No comments yet" description="This user hasn't commented on anything yet." />
            ) : (
              <div className="space-y-3">
                {comments.map(c => (
                  <div key={c.id} className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] p-3 sm:p-4 anim-fade-up">
                    {c.post_title && (
                      <Link href={`/post/${c.post_id}`} className="text-xs text-[var(--fg4)] hover:text-[var(--brand-600)] transition-colors">
                        in: {c.post_title}
                      </Link>
                    )}
                    <p className="text-sm text-[var(--fg)] mt-1 leading-relaxed">{c.body}</p>
                    <p className="text-[11px] text-[var(--fg4)] mt-1.5">{formatDate(c.created_at)}</p>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
