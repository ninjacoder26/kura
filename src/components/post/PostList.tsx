import PostCard, { type PostData } from './PostCard';
import { EmptyState } from '@/components/ui/Feedback';
import { FileText } from 'lucide-react';
import Button from '@/components/ui/Button';
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
      <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)]">
        <EmptyState
          icon={<FileText className="h-7 w-7" />}
          title={emptyTitle}
          description={emptyDescription}
          action={
            <Link href="/submit">
              <Button size="sm">Create a post</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden divide-y divide-[var(--border)]">
      {posts.map(post => (
        <PostCard key={post.id} post={post} showCommunity={showCommunity} />
      ))}
    </div>
  );
}
