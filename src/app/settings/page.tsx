'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/Header';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!authLoading && !user) router.replace('/login?redirect=/settings'); }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from('profiles').select('display_name, bio, location, website').eq('id', user!.id).single();
      if (data) {
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
        setLocation(data.location || '');
        setWebsite(data.website || '');
      }
      setLoading(false);
    }
    load();
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('profiles').update({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        location: location.trim() || null,
        website: website.trim() || null,
      }).eq('id', user.id);
      if (error) throw error;
      toast('success', 'Profile updated');
    } catch (err: any) { toast('error', err.message || 'Failed to update'); } finally { setSaving(false); }
  }

  if (authLoading || loading) return <div className="min-h-screen"><Header /><div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand-600)] border-t-transparent" /></div></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="px-4 py-6 max-w-[540px] mx-auto">
        <h1 className="text-xl font-bold text-[var(--fg)] mb-1">Edit Profile</h1>
        <p className="text-sm text-[var(--fg3)] mb-6">Update your public profile information.</p>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-[var(--fg2)] mb-1.5 uppercase tracking-wide">Display Name</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your display name" maxLength={50}
              className="w-full h-10 px-3 text-sm rounded border bg-[var(--bg)] border-[var(--border)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-600)] transition-all hover:border-[var(--border-strong)]" />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--fg2)] mb-1.5 uppercase tracking-wide">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself" rows={3} maxLength={200}
              className="w-full p-3 text-sm rounded border bg-[var(--bg)] border-[var(--border)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-600)] transition-all hover:border-[var(--border-strong)] resize-none" />
            <p className="text-xs text-[var(--fg4)] mt-1">{bio.length}/200</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--fg2)] mb-1.5 uppercase tracking-wide">Location</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Kathmandu, Nepal" maxLength={100}
              className="w-full h-10 px-3 text-sm rounded border bg-[var(--bg)] border-[var(--border)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-600)] transition-all hover:border-[var(--border-strong)]" />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--fg2)] mb-1.5 uppercase tracking-wide">Website</label>
            <input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://example.com" maxLength={200}
              className="w-full h-10 px-3 text-sm rounded border bg-[var(--bg)] border-[var(--border)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-600)] transition-all hover:border-[var(--border-strong)]" />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving}
              className={`kura-btn text-sm ${!saving ? 'bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)]' : 'bg-[var(--fg4)] text-[var(--bg)] cursor-not-allowed opacity-50'}`}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
