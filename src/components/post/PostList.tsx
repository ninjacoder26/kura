import PostCard, { type PostData } from './PostCard';
import { EmptyState } from '@/components/ui/Feedback';
import { FileText } from 'lucide-react';
import Link from 'next/link';

interface PostListProps {
  posts: PostData[];
  emptyTitle?: string;
  emptyDescription?: string;
  showCommunity?: boolean;
}

export default function PostList({ posts, emptyTitle = 'No posts yet', emptyDescription = 'Be the first to share something.', showCommunity = true }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          icon={<FileText className="h-7 w-7" />}
          title={emptyTitle}
          description={emptyDescription}
          action={
            <Link href="/submit" className="reddit-btn bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)]">
              Create a post
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-2">
      {posts.map(post => (
        <PostCard key={post.id} post={post} showCommunity={showCommunity} />
      ))}
    </div>
  );
}
