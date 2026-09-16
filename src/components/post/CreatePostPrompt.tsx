'use client';

import Link from 'next/link';
import { User } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

export default function CreatePostPrompt() {
  const { user } = useAuth();

  return (
    <Link href="/submit">
      <div className="post-card flex items-center gap-3 px-3 py-2.5 mb-3 cursor-pointer hover:border-[var(--border-strong)] transition-colors">
        <div className="h-9 w-9 rounded-full bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-center shrink-0 overflow-hidden">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <User className="h-5 w-5 text-[var(--fg4)]" />
          )}
        </div>
        <span className="text-sm text-[var(--fg4)]">What&apos;s on your mind?</span>
      </div>
    </Link>
  );
}
