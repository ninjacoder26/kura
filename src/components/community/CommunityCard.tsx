'use client';

import Link from 'next/link';
import { formatNumber } from '@/lib/utils';
import JoinButton from '@/components/community/JoinButton';

export interface CommunityData {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  icon_url?: string;
  color: string;
  member_count: number;
  post_count: number;
  category: string;
}

export default function CommunityCard({ community }: { community: CommunityData }) {
  return (
    <Link href={`/k/${community.slug}`} className="block">
      <div className="post-card flex items-center gap-3 p-3 hover:border-[var(--border-strong)] transition-colors">
        <div
          className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0"
          style={{ backgroundColor: community.color }}
        >
          {community.icon_url ? (
            <img src={community.icon_url} alt={community.name} className="h-full w-full rounded-full object-cover" />
          ) : (
            community.name.charAt(0)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-sm text-[var(--fg)]">k/{community.slug}</h3>
          <p className="text-xs text-[var(--fg4)] mt-0.5 line-clamp-1">{community.description}</p>
          <div className="flex items-center gap-2 text-xs text-[var(--fg4)] mt-1">
            <span>{formatNumber(community.member_count)} members</span>
            <span>·</span>
            <span>{formatNumber(community.post_count)} posts</span>
          </div>
        </div>
        {community.id && (
          <JoinButton communityId={community.id} communityName={community.name} />
        )}
      </div>
    </Link>
  );
}
