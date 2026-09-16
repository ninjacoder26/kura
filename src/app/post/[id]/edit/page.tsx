'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { LoadingSpinner } from '@/components/ui/Feedback';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

function EditPostForm() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!authLoading && !user) router.replace('/login'); }, [user, authLoading, router]);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from('posts').select('title, body, author_id').eq('id', id).single();
      if (data) {
        if (user && data.author_id !== user.id) { router.push('/'); return; }
        setTitle(data.title);
        setBody(data.body || '');
      }
      setLoading(false);
    }
    load();
  }, [id, user, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('posts').update({ title: title.trim(), body: body.trim() }).eq('id', id);
      if (error) throw error;
      toast('success', 'Post updated');
      router.push(`/post/${id}`);
    } catch (err: any) { toast('error', err.message || 'Failed to update'); } finally { setSaving(false); }
  }

  if (authLoading || loading) return <div className="min-h-screen"><Header /><LoadingSpinner /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="px-4 py-4 max-w-[740px] mx-auto">
        <h1 className="text-lg font-medium text-[var(--fg)] mb-4">Edit Post</h1>
        <form onSubmit={handleSave} className="space-y-3">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" maxLength={300} required />
          <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Body (optional)" className="min-h-[200px]" />
          <div className="flex items-center justify-end gap-2">
            <Link href={`/post/${id}`}><button type="button" className="kura-btn border border-[var(--border)] text-[var(--fg2)] hover:border-[var(--border-strong)] bg-transparent text-sm">Cancel</button></Link>
            <button type="submit" disabled={!title.trim() || saving}
              className={`kura-btn text-sm ${title.trim() && !saving ? 'bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)]' : 'bg-[var(--fg4)] text-[var(--bg)] cursor-not-allowed opacity-50'}`}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
      <MobileNav />
    </div>
  );
}

export default function EditPostPage() {
  return <Suspense fallback={<div className="min-h-screen"><Header /><LoadingSpinner /></div>}><EditPostForm /></Suspense>;
}
