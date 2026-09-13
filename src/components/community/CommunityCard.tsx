import Link from 'next/link';
import { Users } from 'lucide-react';
import Card from '@/components/ui/Card';
import { formatNumber } from '@/lib/utils';

interface CommunityCardProps {
  community: {
    name: string;
    slug: string;
    description?: string;
    icon_url?: string;
    color: string;
    member_count: number;
    post_count: number;
    category: string;
  };
}

export default function CommunityCard({ community }: CommunityCardProps) {
  return (
    <Link href={`/r/${community.slug}`}>
      <Card hover padding="md" className="h-full">
        <div className="flex items-start gap-3">
          <div
            className="h-12 w-12 rounded-[var(--radius-md)] flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{ backgroundColor: community.color }}
          >
            {community.icon_url ? (
              <img
                src={community.icon_url}
                alt={community.name}
                className="h-full w-full rounded-[var(--radius-md)] object-cover"
              />
            ) : (
              community.name.charAt(0)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-[var(--color-text)] group-hover:text-[var(--color-brand-600)] truncate">
              r/{community.slug}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 capitalize">
              {community.category}
            </p>
          </div>
        </div>
        {community.description && (
          <p className="mt-2 text-sm text-[var(--color-text-secondary)] line-clamp-2">
            {community.description}
          </p>
        )}
        <div className="mt-3 flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {formatNumber(community.member_count)} members
          </span>
          <span>{formatNumber(community.post_count)} posts</span>
        </div>
      </Card>
    </Link>
  );
}
