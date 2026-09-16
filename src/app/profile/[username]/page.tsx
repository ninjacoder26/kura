'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import PostList from '@/components/post/PostList';
import type { PostData } from '@/components/post/PostCard';
import { LoadingSpinner, EmptyState } from '@/components/ui/Feedback';
import { cn, formatDate } from '@/lib/utils';
import { MapPin, Calendar, Link as LinkIcon, ArrowBigUp, MessageSquare, Ban, Twitter, Instagram, Github } from 'lucide-react';
import Link from 'next/link';

interface UserComment { id: string; body: string; post_id: string; post_title?: string; created_at: string; }

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const [username, setUsername] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [comments, setComments] = useState<UserComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts');

  useEffect(() => { params.then(p => setUsername(p.username)); }, [params]);

  useEffect(() => {
    if (!username) return;
    async function load() {
      try {
        const supabase = createClient();
        const { data: prof, error: profErr } = await supabase.from('profiles').select('*').eq('username', username).single();
        if (profErr) throw profErr;
        setProfile(prof);
        if (prof) {
          const { data: postData } = await supabase.from('posts').select('*, author:profiles!posts_author_id_fkey(username,display_name,avatar_url), community:communities!posts_community_id_fkey(name,slug,color)').eq('author_id', prof.id).eq('is_removed', false).order('created_at', { ascending: false }).limit(20);
          if (postData) setPosts((postData as any[]).map((p: any) => ({ ...p, author: p.author || { username: 'unknown' }, community: p.community || undefined })));
          const { data: commentData } = await supabase.from('comments').select('id, body, post_id, created_at, posts!comments_post_id_fkey(title)').eq('author_id', prof.id).eq('is_removed', false).order('created_at', { ascending: false }).limit(20);
          if (commentData) setComments((commentData as any[]).map((c: any) => ({ id: c.id, body: c.body, post_id: c.post_id, post_title: c.posts?.title, created_at: c.created_at })));
        }
      } catch (err: any) { setError(err.message || 'Failed to load profile'); } finally { setLoading(false); }
    }
    load();
  }, [username]);

  if (loading) return <div className="min-h-screen"><Header /><LoadingSpinner /></div>;
  if (error || !profile) return <div className="min-h-screen"><Header /><div className="px-4 py-8"><EmptyState title={error || 'User not found'} description="This profile doesn't exist." /></div></div>;

  const profileColor = profile.theme_color || 'var(--brand-600)';

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Header />
      {/* Banner */}
      <div className="h-24 sm:h-36 relative">
        {profile.cover_url ? (
          <img src={profile.cover_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${profileColor}, ${profileColor}88)` }} />
        )}
      </div>

      {/* Profile Header */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="px-4 max-w-[900px] mx-auto">
          <div className="flex items-end gap-3 -mt-6 pb-3">
            <div className="h-[72px] w-[72px] sm:h-20 sm:w-20 rounded-full border-4 border-[var(--surface)] flex items-center justify-center text-white font-bold text-xl shrink-0 overflow-hidden"
              style={{ background: profileColor }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                (profile.display_name || profile.username || '?').charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--fg)] flex items-center gap-2">
                {profile.display_name || profile.username}
                {profile.is_banned && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full">
                    <Ban className="h-3 w-3" /> Banned
                  </span>
                )}
              </h1>
              <p className="text-sm text-[var(--fg4)]">@{profile.username}</p>
            </div>
          </div>
        </div>
      </div>

      {profile.is_banned && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-4 mt-4">
          <div className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-500" />
            <p className="text-sm font-medium text-red-700">This account has been banned</p>
          </div>
        </div>
      )}

      <div className="flex px-4 py-4 gap-5 max-w-[900px] mx-auto">
        <main className="flex-1 min-w-0">
          <div className="flex items-center gap-0 border-b border-[var(--border)] mb-3">
            {[{ key: 'posts' as const, label: 'Posts', icon: ArrowBigUp }, { key: 'comments' as const, label: 'Comments', icon: MessageSquare }].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={cn('flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold border-b-2 transition-colors', activeTab === tab.key ? 'border-[var(--brand-600)] text-[var(--brand-600)]' : 'border-transparent text-[var(--fg4)] hover:text-[var(--fg3)]')}>
                <tab.icon className="h-4 w-4" /> {tab.label}
              </button>
            ))}
          </div>
          <div className="pb-20 lg:pb-8">
            {activeTab === 'posts' && <PostList posts={posts} emptyTitle="No posts yet" emptyDescription="This user hasn't posted anything yet." />}
            {activeTab === 'comments' && (comments.length === 0 ? (
              <EmptyState title="No comments yet" description="This user hasn't commented on anything yet." />
            ) : (
              <div className="space-y-2">{comments.map(c => (
                <div key={c.id} className="post-card p-3 anim-fade-up">
                  {c.post_title && <Link href={`/post/${c.post_id}`} className="text-xs text-[var(--fg4)] hover:text-[var(--brand-600)] transition-colors font-bold">{c.post_title}</Link>}
                  <p className="text-sm text-[var(--fg2)] mt-1 leading-relaxed">{c.body}</p>
                  <p className="text-xs text-[var(--fg4)] mt-1.5">{formatDate(c.created_at)}</p>
                </div>
              ))}</div>
            ))}
          </div>
        </main>

        <aside className="hidden lg:block w-[312px] shrink-0">
          <div className="sticky top-[60px] pb-8">
            <div className="sidebar-widget">
              <div className="sidebar-widget-header" style={{ borderBottomColor: profileColor }}>About</div>
              <div className="p-3 space-y-3">
                {profile.bio && <p className="text-sm text-[var(--fg2)] leading-relaxed">{profile.bio}</p>}

                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--fg4)]">
                  {profile.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {profile.location}</span>}
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-[var(--brand-600)]">
                      <LinkIcon className="h-3.5 w-3.5" /> {profile.website.replace(/https?:\/\//, '')}
                    </a>
                  )}
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>

                {/* Social Links */}
                {(profile.twitter || profile.instagram || profile.github) && (
                  <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
                    {profile.twitter && (
                      <a href={`https://x.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer"
                        className="h-8 w-8 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-[var(--fg4)] hover:text-[var(--fg)] hover:bg-[var(--border)] transition-colors">
                        <Twitter className="h-4 w-4" />
                      </a>
                    )}
                    {profile.instagram && (
                      <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer"
                        className="h-8 w-8 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-[var(--fg4)] hover:text-[var(--fg)] hover:bg-[var(--border)] transition-colors">
                        <Instagram className="h-4 w-4" />
                      </a>
                    )}
                    {profile.github && (
                      <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer"
                        className="h-8 w-8 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-[var(--fg4)] hover:text-[var(--fg)] hover:bg-[var(--border)] transition-colors">
                        <Github className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-5 pt-3 border-t border-[var(--border)] text-sm">
                  <div><p className="font-bold text-[var(--fg)]">{(profile.post_count || 0).toLocaleString()}</p><p className="text-[11px] text-[var(--fg4)]">Posts</p></div>
                  <div><p className="font-bold text-[var(--fg)]">{(profile.comment_count || 0).toLocaleString()}</p><p className="text-[11px] text-[var(--fg4)]">Comments</p></div>
                  <div><p className="font-bold" style={{ color: profileColor }}>{(profile.reputation || 0).toLocaleString()}</p><p className="text-[11px] text-[var(--fg4)]">Reputation</p></div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
      <MobileNav />
    </div>
  );
}
