export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          bio: string;
          avatar_url: string | null;
          cover_url: string | null;
          location: string | null;
          website: string | null;
          twitter: string | null;
          instagram: string | null;
          github: string | null;
          theme_color: string | null;
          role: 'user' | 'moderator' | 'admin';
          is_banned: boolean;
          ban_reason: string | null;
          reputation: number;
          post_count: number;
          comment_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          bio?: string;
          avatar_url?: string | null;
          cover_url?: string | null;
          location?: string | null;
          website?: string | null;
          twitter?: string | null;
          instagram?: string | null;
          github?: string | null;
          theme_color?: string | null;
          role?: 'user' | 'moderator' | 'admin';
          is_banned?: boolean;
          ban_reason?: string | null;
          reputation?: number;
          post_count?: number;
          comment_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          bio?: string;
          avatar_url?: string | null;
          cover_url?: string | null;
          location?: string | null;
          website?: string | null;
          twitter?: string | null;
          instagram?: string | null;
          github?: string | null;
          theme_color?: string | null;
          role?: 'user' | 'moderator' | 'admin';
          is_banned?: boolean;
          ban_reason?: string | null;
          reputation?: number;
          post_count?: number;
          comment_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      communities: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          long_description: string | null;
          icon_url: string | null;
          banner_url: string | null;
          color: string;
          category: string;
          rules: string | null;
          member_count: number;
          post_count: number;
          is_archived: boolean;
          is_private: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string;
          long_description?: string | null;
          icon_url?: string | null;
          banner_url?: string | null;
          color?: string;
          category?: string;
          rules?: string | null;
          member_count?: number;
          post_count?: number;
          is_archived?: boolean;
          is_private?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string;
          long_description?: string | null;
          icon_url?: string | null;
          banner_url?: string | null;
          color?: string;
          category?: string;
          rules?: string | null;
          member_count?: number;
          post_count?: number;
          is_archived?: boolean;
          is_private?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      community_members: {
        Row: {
          id: string;
          community_id: string;
          user_id: string;
          role: 'member' | 'moderator' | 'admin';
          is_muted: boolean;
          joined_at: string;
        };
        Insert: {
          id?: string;
          community_id: string;
          user_id: string;
          role?: 'member' | 'moderator' | 'admin';
          is_muted?: boolean;
          joined_at?: string;
        };
        Update: {
          id?: string;
          community_id?: string;
          user_id?: string;
          role?: 'member' | 'moderator' | 'admin';
          is_muted?: boolean;
          joined_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          title: string;
          body: string;
          type: 'text' | 'link' | 'image' | 'poll';
          url: string | null;
          image_url: string | null;
          author_id: string;
          community_id: string | null;
          upvotes: number;
          downvotes: number;
          comment_count: number;
          is_pinned: boolean;
          is_locked: boolean;
          is_removed: boolean;
          removed_by: string | null;
          remove_reason: string | null;
          tags: string[];
          tags_text: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body?: string;
          type?: 'text' | 'link' | 'image' | 'poll';
          url?: string | null;
          image_url?: string | null;
          author_id: string;
          community_id?: string | null;
          upvotes?: number;
          downvotes?: number;
          comment_count?: number;
          is_pinned?: boolean;
          is_locked?: boolean;
          is_removed?: boolean;
          removed_by?: string | null;
          remove_reason?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          body?: string;
          type?: 'text' | 'link' | 'image' | 'poll';
          url?: string | null;
          image_url?: string | null;
          author_id?: string;
          community_id?: string | null;
          upvotes?: number;
          downvotes?: number;
          comment_count?: number;
          is_pinned?: boolean;
          is_locked?: boolean;
          is_removed?: boolean;
          removed_by?: string | null;
          remove_reason?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          body: string;
          author_id: string;
          post_id: string;
          parent_id: string | null;
          upvotes: number;
          downvotes: number;
          depth: number;
          is_removed: boolean;
          removed_by: string | null;
          remove_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          body: string;
          author_id: string;
          post_id: string;
          parent_id?: string | null;
          upvotes?: number;
          downvotes?: number;
          depth?: number;
          is_removed?: boolean;
          removed_by?: string | null;
          remove_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          body?: string;
          author_id?: string;
          post_id?: string;
          parent_id?: string | null;
          upvotes?: number;
          downvotes?: number;
          depth?: number;
          is_removed?: boolean;
          removed_by?: string | null;
          remove_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      votes: {
        Row: {
          id: string;
          user_id: string;
          post_id: string | null;
          comment_id: string | null;
          value: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id?: string | null;
          comment_id?: string | null;
          value: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string | null;
          comment_id?: string | null;
          value?: number;
          created_at?: string;
        };
      };
      saved_posts: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          created_at?: string;
        };
      };
      post_follows: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          created_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          post_id: string | null;
          comment_id: string | null;
          reason: string;
          category: string;
          status: string;
          reviewed_by: string | null;
          review_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          post_id?: string | null;
          comment_id?: string | null;
          reason: string;
          category?: string;
          status?: string;
          reviewed_by?: string | null;
          review_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          post_id?: string | null;
          comment_id?: string | null;
          reason?: string;
          category?: string;
          status?: string;
          reviewed_by?: string | null;
          review_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      moderation_logs: {
        Row: {
          id: string;
          moderator_id: string;
          action: string;
          target_type: string;
          target_id: string;
          reason: string | null;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          moderator_id: string;
          action: string;
          target_type: string;
          target_id: string;
          reason?: string | null;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          moderator_id?: string;
          action?: string;
          target_type?: string;
          target_id?: string;
          reason?: string | null;
          details?: Json;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          link: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          link?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          body?: string | null;
          link?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
    };
    Functions: Record<string, never>;
  };
}
