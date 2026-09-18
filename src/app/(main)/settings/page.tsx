'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { User, Camera, Lock, Image, Twitter, Instagram, Github, Crown } from 'lucide-react';
import { uploadToCloudinary, isCloudinaryConfigured, validateImageFile } from '@/lib/cloudinary';

const PROFILE_COLORS = [
  '#0079D3', '#D93900', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#787C7E',
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');
  const [github, setGithub] = useState('');
  const [themeColor, setThemeColor] = useState('#0079D3');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [savedAvatarUrl, setSavedAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Banner
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [savedBannerUrl, setSavedBannerUrl] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => { if (!authLoading && !user) router.replace('/login?redirect=/settings'); }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
      if (data) {
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
        setLocation(data.location || '');
        setWebsite(data.website || '');
        setTwitter(data.twitter || '');
        setInstagram(data.instagram || '');
        setGithub(data.github || '');
        setThemeColor(data.theme_color || '#0079D3');
        if (data.avatar_url) { setAvatarPreview(data.avatar_url); setSavedAvatarUrl(data.avatar_url); }
        if (data.cover_url) { setBannerPreview(data.cover_url); setSavedBannerUrl(data.cover_url); }
      }
      setLoading(false);
    }
    load();
  }, [user]);

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) { toast('error', validation.error!); return; }
    if (file.size > 5 * 1024 * 1024) { toast('error', 'Image must be under 5MB'); return; }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleBannerSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) { toast('error', validation.error!); return; }
    if (file.size > 10 * 1024 * 1024) { toast('error', 'Banner must be under 10MB'); return; }
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = () => setBannerPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadImage(file: File, folder: string): Promise<string | null> {
    try {
      if (isCloudinaryConfigured()) {
        const result = await uploadToCloudinary(file, `kura/profiles/${folder}`);
        return result.secure_url;
      }
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const path = `${user!.id}/${folder}.${ext}`;
      const bucket = folder === 'avatar' ? 'avatars' : 'community-banners';
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      return urlData.publicUrl;
    } catch (err: any) {
      toast('error', err.message || `${folder} upload failed`);
      return null;
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const supabase = createClient();
      // Start from the last SAVED urls — a failed upload must never wipe them.
      let avatarUrl = savedAvatarUrl;
      let bannerUrl = savedBannerUrl;

      if (avatarFile) {
        setUploadingAvatar(true);
        const uploaded = await uploadImage(avatarFile, 'avatar');
        setUploadingAvatar(false);
        if (!uploaded) throw new Error('Avatar upload failed — nothing was saved. Check your connection and try again.');
        avatarUrl = uploaded;
      }
      if (bannerFile) {
        setUploadingBanner(true);
        const uploaded = await uploadImage(bannerFile, 'banner');
        setUploadingBanner(false);
        if (!uploaded) throw new Error('Banner upload failed — nothing was saved. Check your connection and try again.');
        bannerUrl = uploaded;
      }

      const normalizedWebsite = (() => {
        const w = website.trim();
        if (!w) return null;
        return /^https?:\/\//i.test(w) ? w : `https://${w}`;
      })();

      const { error } = await supabase.from('profiles').update({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        location: location.trim() || null,
        website: normalizedWebsite,
        twitter: twitter.trim() || null,
        instagram: instagram.trim() || null,
        github: github.trim() || null,
        theme_color: themeColor,
        avatar_url: avatarUrl,
        cover_url: bannerUrl,
      }).eq('id', user.id);
      if (error) throw error;
      setSavedAvatarUrl(avatarUrl);
      setSavedBannerUrl(bannerUrl);
      setAvatarFile(null);
      setBannerFile(null);
      await refreshUser();
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

  if (authLoading || loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand-500)] border-t-transparent" /></div>;
  if (!user) return null;

  const isUploading = uploadingAvatar || uploadingBanner;

  return (
      <div className="px-4 py-6 max-w-[640px] mx-auto">
        <h1 className="text-xl font-bold text-[var(--fg)] mb-1">Edit Profile</h1>
        <p className="text-sm text-[var(--fg3)] mb-6">Customize your public profile.</p>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Banner Upload */}
          <div>
            <label className="block text-xs font-bold text-[var(--fg2)] mb-2 uppercase tracking-wide">Profile Banner</label>
            <div className="relative">
              <input ref={bannerInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleBannerSelect} className="hidden" />
              {bannerPreview ? (
                <div className="relative group rounded-lg overflow-hidden border border-[var(--border)]">
                  <img src={bannerPreview} alt="Banner" className="w-full h-[120px] sm:h-[160px] object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button type="button" onClick={() => bannerInputRef.current?.click()}
                      className="px-4 py-2 bg-white/90 rounded-full text-sm font-bold text-gray-800 hover:bg-white transition-colors">
                      Change
                    </button>
                    <button type="button" onClick={() => { setBannerFile(null); setBannerPreview(null); }}
                      className="px-4 py-2 bg-red-500/90 rounded-full text-sm font-bold text-white hover:bg-red-500 transition-colors">
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => bannerInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[var(--border)] rounded-lg p-6 text-center hover:border-[var(--brand-500)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer">
                  <Image className="h-8 w-8 mx-auto text-[var(--fg4)] mb-2" />
                  <p className="text-sm text-[var(--fg4)]">Add banner image</p>
                  <p className="text-xs text-[var(--fg4)] mt-1">Recommended: 1200x300px. Max 10MB.</p>
                </button>
              )}
            </div>
          </div>

          {/* Avatar + Basic Info */}
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <label className="block text-xs font-bold text-[var(--fg2)] mb-2 uppercase tracking-wide">Avatar</label>
              <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleAvatarSelect} className="hidden" />
              <button type="button" onClick={() => avatarInputRef.current?.click()}
                className="relative h-20 w-20 rounded-full border-2 border-dashed border-[var(--border)] hover:border-[var(--brand-500)] flex items-center justify-center overflow-hidden transition-colors group">
                {avatarPreview ? (
                  <>
                    <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                  </>
                ) : (
                  <User className="h-8 w-8 text-[var(--fg4)]" />
                )}
              </button>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--fg2)] mb-1.5 uppercase tracking-wide">Display Name</label>
                <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your display name" maxLength={50}
                  className="w-full h-11 px-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-500)] hover:border-[var(--border-strong)] transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--fg2)] mb-1.5 uppercase tracking-wide">Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself" rows={3} maxLength={200}
                  className="w-full p-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-500)] hover:border-[var(--border-strong)] transition-all resize-none" />
                <p className="text-xs text-[var(--fg4)] mt-1">{bio.length}/200</p>
              </div>
            </div>
          </div>

          {/* Location & Website */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--fg2)] mb-1.5 uppercase tracking-wide">Location</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Kathmandu, Nepal" maxLength={100}
                className="w-full h-11 px-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-500)] hover:border-[var(--border-strong)] transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--fg2)] mb-1.5 uppercase tracking-wide">Website</label>
              <input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://example.com" maxLength={200}
                className="w-full h-11 px-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-500)] hover:border-[var(--border-strong)] transition-all" />
            </div>
          </div>

          {/* Social Links */}
          <div>
            <label className="block text-xs font-bold text-[var(--fg2)] mb-2 uppercase tracking-wide">Social Links</label>
            <div className="space-y-3">
              <div className="relative">
                <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg4)]" />
                <input type="text" value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="Twitter / X username" maxLength={50}
                  className="w-full h-11 pl-10 pr-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-500)] hover:border-[var(--border-strong)] transition-all" />
              </div>
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg4)]" />
                <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="Instagram username" maxLength={50}
                  className="w-full h-11 pl-10 pr-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-500)] hover:border-[var(--border-strong)] transition-all" />
              </div>
              <div className="relative">
                <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg4)]" />
                <input type="text" value={github} onChange={e => setGithub(e.target.value)} placeholder="GitHub username" maxLength={50}
                  className="w-full h-11 pl-10 pr-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-500)] hover:border-[var(--border-strong)] transition-all" />
              </div>
            </div>
          </div>

          {/* Theme Color */}
          <div>
            <label className="block text-xs font-bold text-[var(--fg2)] mb-2 uppercase tracking-wide">Profile Color</label>
            <div className="flex items-center gap-2">
              {PROFILE_COLORS.map(color => (
                <button key={color} type="button" onClick={() => setThemeColor(color)}
                  className={`h-8 w-8 rounded-full transition-all ${themeColor === color ? 'ring-2 ring-offset-2 ring-[var(--fg)] scale-110' : 'hover:scale-105'}`}
                  style={{ background: color }} />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={() => router.back()}
              className="px-6 py-2.5 text-sm font-bold text-[var(--fg4)] hover:bg-[var(--surface-hover)] rounded-full transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving || isUploading}
              className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all ${!saving && !isUploading ? 'bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)]' : 'bg-[var(--fg4)] text-[var(--bg)] cursor-not-allowed opacity-50'}`}>
              {saving || isUploading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Password Change */}
        <div className="mt-8 pt-6 border-t border-[var(--border)]">
          <h2 className="text-sm font-bold text-[var(--fg)] mb-1 flex items-center gap-2"><Lock className="h-4 w-4" /> Change Password</h2>
          <p className="text-xs text-[var(--fg4)] mb-4">Update your account password.</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[var(--fg2)] mb-1.5 uppercase tracking-wide">New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" minLength={6}
                className="w-full h-11 px-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-500)] hover:border-[var(--border-strong)] transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--fg2)] mb-1.5 uppercase tracking-wide">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" minLength={6}
                className="w-full h-11 px-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-500)] hover:border-[var(--border-strong)] transition-all" />
            </div>
            <button type="button" onClick={handlePasswordChange} disabled={changingPassword || !newPassword.trim()}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${!changingPassword && newPassword.trim() ? 'bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)]' : 'bg-[var(--fg4)] text-[var(--bg)] cursor-not-allowed opacity-50'}`}>
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>

        {/* Admin tools — visible to admins only */}
        {user.role === 'admin' && (
          <AdminTools />
        )}
        <div className="pb-20 lg:pb-8" />
      </div>
  );
}

function AdminTools() {
  const { toast } = useToast();
  const [sweeping, setSweeping] = useState(false);
  const [lastSweep, setLastSweep] = useState<{ tagged: number; at: string } | null>(null);

  async function handleSweep() {
    setSweeping(true);
    try {
      const res = await fetch('/api/tag-post', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || 'Sweep failed');
      const n = (json.tagged || []).length;
      setLastSweep({ tagged: n, at: new Date().toLocaleTimeString() });
      toast('success', n > 0 ? `Tagged ${n} post${n === 1 ? '' : 's'}` : 'Nothing untagged — all caught up');
    } catch (err: any) {
      toast('error', err.message || 'Sweep failed');
    } finally {
      setSweeping(false);
    }
  }

  return (
    <div className="mt-8 pt-6 border-t border-[var(--border)]">
      <h2 className="text-sm font-bold text-[var(--fg)] mb-1 flex items-center gap-2">
        <Crown className="h-4 w-4 text-[#FFB000]" fill="currentColor" /> Admin Tools
      </h2>
      <p className="text-xs text-[var(--fg4)] mb-4">Run the AI tagger over the oldest untagged posts (3 per run).</p>
      <button type="button" onClick={handleSweep} disabled={sweeping}
        className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${!sweeping ? 'bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)]' : 'bg-[var(--fg4)] text-[var(--bg)] cursor-not-allowed opacity-50'}`}>
        {sweeping ? 'Tagging…' : 'Tag untagged posts'}
      </button>
      {lastSweep && (
        <p className="text-xs text-[var(--fg4)] mt-2">Last run tagged {lastSweep.tagged} at {lastSweep.at}</p>
      )}
    </div>
  );
}
