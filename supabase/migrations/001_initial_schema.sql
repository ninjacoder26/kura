-- =============================================
-- Kura — Nepal Community Platform
-- Initial Database Schema
-- =============================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

-- =============================================
-- PROFILES
-- =============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  bio text default ''::text,
  avatar_url text,
  cover_url text,
  location text,
  website text,
  role text default 'user' check (role in ('user', 'moderator', 'admin')),
  is_banned boolean default false,
  ban_reason text,
  reputation integer default 0,
  post_count integer default 0,
  comment_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Profiles: readable by everyone, editable by owner
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- =============================================
-- COMMUNITIES
-- =============================================
create table public.communities (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  slug text unique not null,
  description text default ''::text,
  long_description text,
  icon_url text,
  banner_url text,
  color text default '#6366f1'::text,
  category text default 'general' check (category in (
    'general', 'cities', 'universities', 'schools',
    'technology', 'gaming', 'culture', 'sports',
    'arts', 'music', 'food', 'travel', 'health',
    'business', 'education', 'events', 'other'
  )),
  rules text,
  member_count integer default 0,
  post_count integer default 0,
  is_archived boolean default false,
  is_private boolean default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.communities enable row level security;

create index idx_communities_slug on public.communities(slug);
create index idx_communities_category on public.communities(category);
create index idx_communities_name_trgm on public.communities using gin (name gin_trgm_ops);

create policy "Communities are viewable by everyone"
  on public.communities for select
  using (not is_private or exists (
    select 1 from public.community_members
    where community_id = id and user_id = auth.uid()
  ));

create policy "Authenticated users can create communities"
  on public.communities for insert
  with check (auth.uid() is not null);

create policy "Community creators and moderators can update"
  on public.communities for update
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.community_members
      where community_id = id and user_id = auth.uid()
      and role in ('moderator', 'admin')
    )
  );

-- =============================================
-- COMMUNITY MEMBERS
-- =============================================
create table public.community_members (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text default 'member' check (role in ('member', 'moderator', 'admin')),
  is_muted boolean default false,
  joined_at timestamptz default now(),
  unique(community_id, user_id)
);

alter table public.community_members enable row level security;

create index idx_community_members_user on public.community_members(user_id);
create index idx_community_members_community on public.community_members(community_id);

create policy "Community members are viewable by everyone"
  on public.community_members for select
  using (true);

create policy "Authenticated users can join communities"
  on public.community_members for insert
  with check (auth.uid() = user_id);

create policy "Users can leave communities"
  on public.community_members for delete
  using (auth.uid() = user_id);

-- =============================================
-- POSTS
-- =============================================
create table public.posts (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  body text default ''::text,
  type text default 'text' check (type in ('text', 'link', 'image', 'poll')),
  url text,
  image_url text,
  author_id uuid not null references public.profiles(id) on delete cascade,
  community_id uuid references public.communities(id) on delete set null,
  upvotes integer default 0,
  downvotes integer default 0,
  comment_count integer default 0,
  is_pinned boolean default false,
  is_locked boolean default false,
  is_removed boolean default false,
  removed_by uuid references public.profiles(id) on delete set null,
  remove_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.posts enable row level security;

create index idx_posts_author on public.posts(author_id);
create index idx_posts_community on public.posts(community_id);
create index idx_posts_created_at on public.posts(created_at desc);
create index idx_posts_score on public.posts((upvotes - downvotes) desc);

create policy "Posts are viewable by everyone"
  on public.posts for select
  using (not is_removed);

create policy "Authenticated users can create posts"
  on public.posts for insert
  with check (auth.uid() = author_id);

create policy "Authors can update own posts"
  on public.posts for update
  using (auth.uid() = author_id);

create policy "Authors can delete own posts"
  on public.posts for delete
  using (auth.uid() = author_id);

-- =============================================
-- COMMENTS
-- =============================================
create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  body text not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  upvotes integer default 0,
  downvotes integer default 0,
  depth integer default 0,
  is_removed boolean default false,
  removed_by uuid references public.profiles(id) on delete set null,
  remove_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.comments enable row level security;

create index idx_comments_post on public.comments(post_id);
create index idx_comments_author on public.comments(author_id);
create index idx_comments_parent on public.comments(parent_id);
create index idx_comments_created on public.comments(created_at desc);

create policy "Comments are viewable by everyone"
  on public.comments for select
  using (not is_removed);

create policy "Authenticated users can create comments"
  on public.comments for insert
  with check (auth.uid() = author_id);

create policy "Authors can update own comments"
  on public.comments for update
  using (auth.uid() = author_id);

create policy "Authors can delete own comments"
  on public.comments for delete
  using (auth.uid() = author_id);

-- =============================================
-- VOTES
-- =============================================
create table public.votes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  value integer not null check (value in (-1, 1)),
  created_at timestamptz default now(),
  unique(user_id, post_id),
  unique(user_id, comment_id),
  check ((post_id is not null and comment_id is null) or (post_id is null and comment_id is not null))
);

alter table public.votes enable row level security;

create index idx_votes_post on public.votes(post_id);
create index idx_votes_comment on public.votes(comment_id);
create index idx_votes_user on public.votes(user_id);

create policy "Votes are viewable by everyone"
  on public.votes for select
  using (true);

create policy "Authenticated users can vote"
  on public.votes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own votes"
  on public.votes for update
  using (auth.uid() = user_id);

create policy "Users can delete own votes"
  on public.votes for delete
  using (auth.uid() = user_id);

-- =============================================
-- SAVED POSTS
-- =============================================
create table public.saved_posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, post_id)
);

alter table public.saved_posts enable row level security;

create policy "Users can view own saved posts"
  on public.saved_posts for select
  using (auth.uid() = user_id);

create policy "Users can save posts"
  on public.saved_posts for insert
  with check (auth.uid() = user_id);

create policy "Users can unsave posts"
  on public.saved_posts for delete
  using (auth.uid() = user_id);

-- =============================================
-- REPORTS
-- =============================================
create table public.reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reason text not null,
  category text default 'other' check (category in (
    'spam', 'harassment', 'hate_speech', 'violence',
    'misinformation', 'copyright', 'nsfw', 'other'
  )),
  status text default 'pending' check (status in ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  review_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check ((post_id is not null and comment_id is null) or (post_id is null and comment_id is not null))
);

alter table public.reports enable row level security;

create policy "Reporters can view own reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

create policy "Moderators can view all reports"
  on public.reports for select
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('moderator', 'admin')
  ));

create policy "Authenticated users can create reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "Moderators can update reports"
  on public.reports for update
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('moderator', 'admin')
  ));

-- =============================================
-- MODERATION LOGS
-- =============================================
create table public.moderation_logs (
  id uuid primary key default uuid_generate_v4(),
  moderator_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  target_type text not null check (target_type in ('post', 'comment', 'user', 'community')),
  target_id uuid not null,
  reason text,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.moderation_logs enable row level security;

create index idx_mod_logs_moderator on public.moderation_logs(moderator_id);
create index idx_mod_logs_target on public.moderation_logs(target_type, target_id);
create index idx_mod_logs_created on public.moderation_logs(created_at desc);

create policy "Moderators can view moderation logs"
  on public.moderation_logs for select
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('moderator', 'admin')
  ));

create policy "Moderators can create moderation logs"
  on public.moderation_logs for insert
  with check (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('moderator', 'admin')
  ));

-- =============================================
-- NOTIFICATIONS (basic foundation)
-- =============================================
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create index idx_notifications_user on public.notifications(user_id, is_read, created_at desc);

create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "System can create notifications"
  on public.notifications for insert
  with check (true);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to update vote counts on posts
create or replace function public.handle_post_vote()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.value = 1 then
      update public.posts set upvotes = upvotes + 1 where id = NEW.post_id;
    else
      update public.posts set downvotes = downvotes + 1 where id = NEW.post_id;
    end if;
    return NEW;
  elsif TG_OP = 'UPDATE' then
    if OLD.value = 1 then
      update public.posts set upvotes = upvotes - 1 where id = NEW.post_id;
    else
      update public.posts set downvotes = downvotes - 1 where id = NEW.post_id;
    end if;
    if NEW.value = 1 then
      update public.posts set upvotes = upvotes + 1 where id = NEW.post_id;
    else
      update public.posts set downvotes = downvotes + 1 where id = NEW.post_id;
    end if;
    return NEW;
  elsif TG_OP = 'DELETE' then
    if OLD.value = 1 then
      update public.posts set upvotes = upvotes - 1 where id = OLD.post_id;
    else
      update public.posts set downvotes = downvotes - 1 where id = OLD.post_id;
    end if;
    return OLD;
  end if;
end;
$$ language plpgsql security definer;

create trigger on_post_vote
  after insert or update or delete on public.votes
  for each row
  when (NEW.post_id is not null or OLD.post_id is not null)
  execute function public.handle_post_vote();

-- Function to update vote counts on comments
create or replace function public.handle_comment_vote()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.value = 1 then
      update public.comments set upvotes = upvotes + 1 where id = NEW.comment_id;
    else
      update public.comments set downvotes = downvotes + 1 where id = NEW.comment_id;
    end if;
    return NEW;
  elsif TG_OP = 'UPDATE' then
    if OLD.value = 1 then
      update public.comments set upvotes = upvotes - 1 where id = NEW.comment_id;
    else
      update public.comments set downvotes = downvotes - 1 where id = NEW.comment_id;
    end if;
    if NEW.value = 1 then
      update public.comments set upvotes = upvotes + 1 where id = NEW.comment_id;
    else
      update public.comments set downvotes = downvotes + 1 where id = NEW.comment_id;
    end if;
    return NEW;
  elsif TG_OP = 'DELETE' then
    if OLD.value = 1 then
      update public.comments set upvotes = upvotes - 1 where id = OLD.comment_id;
    else
      update public.comments set downvotes = downvotes - 1 where id = OLD.comment_id;
    end if;
    return OLD;
  end if;
end;
$$ language plpgsql security definer;

create trigger on_comment_vote
  after insert or update or delete on public.votes
  for each row
  when (NEW.comment_id is not null or OLD.comment_id is not null)
  execute function public.handle_comment_vote();

-- Function to update post comment count
create or replace function public.handle_comment_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = NEW.post_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update public.posts set comment_count = comment_count - 1 where id = OLD.post_id;
    return OLD;
  end if;
end;
$$ language plpgsql security definer;

create trigger on_comment_count
  after insert or delete on public.comments
  for each row
  execute function public.handle_comment_count();

-- Function to update community member count
create or replace function public.handle_community_member_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.communities set member_count = member_count + 1 where id = NEW.community_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update public.communities set member_count = member_count - 1 where id = OLD.community_id;
    return OLD;
  end if;
end;
$$ language plpgsql security definer;

create trigger on_community_member_count
  after insert or delete on public.community_members
  for each row
  execute function public.handle_community_member_count();

-- Function to update post count
create or replace function public.handle_post_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' and NEW.community_id is not null then
    update public.communities set post_count = post_count + 1 where id = NEW.community_id;
    return NEW;
  elsif TG_OP = 'DELETE' and OLD.community_id is not null then
    update public.communities set post_count = post_count - 1 where id = OLD.community_id;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_post_count
  after insert or delete on public.posts
  for each row
  execute function public.handle_post_count();

-- Function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', null)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
