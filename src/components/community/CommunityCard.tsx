import Link from 'next/link';
import { Users } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export interface CommunityData {
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
    <Link href={`/r/${community.slug}`} className="block">
      <div className="post-card flex items-center gap-3 p-3 hover:border-[var(--border-strong)] transition-colors">
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ backgroundColor: community.color }}
        >
          {community.icon_url ? (
            <img src={community.icon_url} alt={community.name} className="h-full w-full rounded-full object-cover" />
          ) : (
            community.name.charAt(0)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-sm text-[var(--fg)] truncate">r/{community.slug}</h3>
          <div className="flex items-center gap-2 text-[11px] text-[var(--fg4)]">
            <span>{formatNumber(community.member_count)} members</span>
            <span>·</span>
            <span>{formatNumber(community.post_count)} posts</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
