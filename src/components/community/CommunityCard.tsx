import Link from 'next/link';
import { Users } from 'lucide-react';
import Card from '@/components/ui/Card';
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
      <Card hover padding="md" className="h-full group">
        <div className="flex items-start gap-3">
          <div
            className="h-11 w-11 sm:h-12 sm:w-12 rounded-[var(--r-md)] flex items-center justify-center text-white font-bold text-base sm:text-lg shrink-0 transition-transform group-hover:scale-105"
            style={{ backgroundColor: community.color }}
          >
            {community.icon_url ? (
              <img src={community.icon_url} alt={community.name} className="h-full w-full rounded-[var(--r-md)] object-cover" />
            ) : (
              community.name.charAt(0)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm text-[var(--fg)] group-hover:text-[var(--brand-600)] truncate transition-colors">
              r/{community.slug}
            </h3>
            <p className="text-[11px] text-[var(--fg4)] mt-0.5 capitalize">{community.category}</p>
          </div>
        </div>
        {community.description && (
          <p className="mt-2.5 text-sm text-[var(--fg2)] line-clamp-2 leading-relaxed">{community.description}</p>
        )}
        <div className="mt-3 flex items-center gap-3 text-xs text-[var(--fg4)]">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {formatNumber(community.member_count)}
          </span>
          <span>{formatNumber(community.post_count)} posts</span>
        </div>
      </Card>
    </Link>
  );
}
