'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/Header';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { User, Camera, Lock } from 'lucide-react';

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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!authLoading && !user) router.replace('/login?redirect=/settings'); }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from('profiles').select('display_name, bio, location, website, avatar_url').eq('id', user!.id).single();
      if (data) {
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
        setLocation(data.location || '');
        setWebsite(data.website || '');
        if (data.avatar_url) setAvatarPreview(data.avatar_url);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) { toast('error', 'Only JPEG, PNG, GIF, and WebP images are allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { toast('error', 'Image must be under 5MB'); return; }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadAvatar(): Promise<string | null> {
    if (!avatarFile || !user) return null;
    setUploadingAvatar(true);
    try {
      const supabase = createClient();
      const ext = avatarFile.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      return urlData.publicUrl;
    } catch (err: any) { toast('error', err.message || 'Avatar upload failed'); return null; } finally { setUploadingAvatar(false); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const supabase = createClient();
      let avatarUrl = avatarPreview;
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
      }
      const { error } = await supabase.from('profiles').update({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        location: location.trim() || null,
        website: website.trim() || null,
        avatar_url: avatarUrl,
      }).eq('id', user.id);
      if (error) throw error;
      toast('success', 'Profile updated');
    } catch (err: any) { toast('error', err.message || 'Failed to update'); } finally { setSaving(false); }
  }

  async function handlePasswordChange() {
    if (!user) return;
    if (newPassword.length < 6) { toast('error', 'Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast('error', 'Passwords do not match'); return; }
    setChangingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast('success', 'Password updated');
      setNewPassword(''); setConfirmPassword('');
    } catch (err: any) { toast('error', err.message || 'Failed to update password'); } finally { setChangingPassword(false); }
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
          {/* (#68): Avatar upload */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-[var(--surface)] flex items-center justify-center">
                  <User className="h-8 w-8 text-[var(--fg4)]" />
                </div>
              )}
              <button type="button" onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-white" />
              </button>
            </div>
            <div>
              <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
              <button type="button" onClick={() => avatarInputRef.current?.click()} className="text-sm text-[var(--brand-600)] font-bold hover:underline">
                {avatarPreview ? 'Change avatar' : 'Upload avatar'}
              </button>
              <p className="text-xs text-[var(--fg4)] mt-0.5">JPEG, PNG, GIF, or WebP. Max 5MB.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--fg2)] mb-1.5 uppercase tracking-wide">Display Name</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your display name" maxLength={50}
              className="w-full h-11 px-3 text-sm rounded border bg-[var(--bg)] border-[var(--border)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-600)] transition-all hover:border-[var(--border-strong)]" />
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
              className="w-full h-11 px-3 text-sm rounded border bg-[var(--bg)] border-[var(--border)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-600)] transition-all hover:border-[var(--border-strong)]" />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--fg2)] mb-1.5 uppercase tracking-wide">Website</label>
            <input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://example.com" maxLength={200}
              className="w-full h-11 px-3 text-sm rounded border bg-[var(--bg)] border-[var(--border)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-600)] transition-all hover:border-[var(--border-strong)]" />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={() => router.back()}
              className="kura-btn border border-[var(--border)] text-[var(--fg2)] hover:border-[var(--border-strong)] bg-transparent text-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className={`kura-btn text-sm ${!saving ? 'bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)]' : 'bg-[var(--fg4)] text-[var(--bg)] cursor-not-allowed opacity-50'}`}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* (#49): Password change section */}
        <div className="mt-8 pt-6 border-t border-[var(--border)]">
          <h2 className="text-sm font-bold text-[var(--fg)] mb-1 flex items-center gap-2"><Lock className="h-4 w-4" /> Change Password</h2>
          <p className="text-xs text-[var(--fg4)] mb-4">Update your account password.</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[var(--fg2)] mb-1.5 uppercase tracking-wide">New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" minLength={6}
                className="w-full h-11 px-3 text-sm rounded border bg-[var(--bg)] border-[var(--border)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-600)] transition-all hover:border-[var(--border-strong)]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--fg2)] mb-1.5 uppercase tracking-wide">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" minLength={6}
                className="w-full h-11 px-3 text-sm rounded border bg-[var(--bg)] border-[var(--border)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-600)] transition-all hover:border-[var(--border-strong)]" />
            </div>
            <button type="button" onClick={handlePasswordChange} disabled={changingPassword || !newPassword.trim()}
              className={`kura-btn text-sm ${!changingPassword && newPassword.trim() ? 'bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)]' : 'bg-[var(--fg4)] text-[var(--bg)] cursor-not-allowed opacity-50'}`}>
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
