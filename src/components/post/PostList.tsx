import PostCard from './PostCard';

interface Post {
  id: string;
  title: string;
  body?: string;
  type?: string;
  author: {
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  community?: {
    name: string;
    slug: string;
    color?: string;
  };
  upvotes: number;
  downvotes: number;
  comment_count: number;
  created_at: string;
}

interface PostListProps {
  posts: Post[];
  emptyMessage?: string;
  compact?: boolean;
}

export default function PostList({ posts, emptyMessage = 'No posts yet.', compact = false }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-[var(--color-text-muted)] text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} compact={compact} />
      ))}
    </div>
  );
}
