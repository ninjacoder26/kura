-- =============================================
-- Kura — Fix triggers and add missing functionality
-- Migration 002: Fix counts, updated_at, and security
-- =============================================

-- 1. Fix comment_count: decrement on soft-delete, increment on un-delete
create or replace function public.handle_comment_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = NEW.post_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update public.posts set comment_count = comment_count - 1 where id = OLD.post_id;
    return OLD;
  elsif TG_OP = 'UPDATE' then
    if OLD.is_removed = false and NEW.is_removed = true then
      update public.posts set comment_count = comment_count - 1 where id = NEW.post_id;
    elsif OLD.is_removed = true and NEW.is_removed = false then
      update public.posts set comment_count = comment_count + 1 where id = NEW.post_id;
    end if;
    return NEW;
  end if;
end;
$$ language plpgsql security definer;

-- Drop old trigger and recreate
drop trigger if exists on_comment_count on public.comments;
create trigger on_comment_count
  after insert or update or delete on public.comments
  for each row
  execute function public.handle_comment_count();

-- 2. Auto-update post_count and comment_count on profiles
create or replace function public.handle_profile_post_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.profiles set post_count = post_count + 1 where id = NEW.author_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update public.profiles set post_count = post_count - 1 where id = OLD.author_id;
    return OLD;
  elsif TG_OP = 'UPDATE' then
    if OLD.is_removed = false and NEW.is_removed = true then
      update public.profiles set post_count = post_count - 1 where id = NEW.author_id;
    elsif OLD.is_removed = true and NEW.is_removed = false then
      update public.profiles set post_count = post_count + 1 where id = NEW.author_id;
    end if;
    return NEW;
  end if;
end;
$$ language plpgsql security definer;

create trigger on_profile_post_count
  after insert or update or delete on public.posts
  for each row
  execute function public.handle_profile_post_count();

create or replace function public.handle_profile_comment_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.profiles set comment_count = comment_count + 1 where id = NEW.author_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update public.profiles set comment_count = comment_count - 1 where id = OLD.author_id;
    return OLD;
  elsif TG_OP = 'UPDATE' then
    if OLD.is_removed = false and NEW.is_removed = true then
      update public.profiles set comment_count = comment_count - 1 where id = NEW.author_id;
    elsif OLD.is_removed = true and NEW.is_removed = false then
      update public.profiles set comment_count = comment_count + 1 where id = NEW.author_id;
    end if;
    return NEW;
  end if;
end;
$$ language plpgsql security definer;

create trigger on_profile_comment_count
  after insert or update or delete on public.comments
  for each row
  execute function public.handle_profile_comment_count();

-- 3. Auto-update updated_at on all tables that have it
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_communities
  before update on public.communities
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_posts
  before update on public.posts
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_comments
  before update on public.comments
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_reports
  before update on public.reports
  for each row execute function public.handle_updated_at();

-- 4. Add comment depth limit trigger (max 10 levels)
create or replace function public.enforce_comment_depth()
returns trigger as $$
begin
  if NEW.depth > 10 then
    raise exception 'Comment nesting too deep (max 10 levels)';
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger check_comment_depth
  before insert on public.comments
  for each row execute function public.enforce_comment_depth();

-- 5. Add is_locked enforcement on comment creation
create or replace function public.enforce_post_locked()
returns trigger as $$
declare
  post_locked boolean;
begin
  select is_locked into post_locked from public.posts where id = NEW.post_id;
  if post_locked = true then
    raise exception 'This post is locked and does not accept new comments';
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger check_post_locked
  before insert on public.comments
  for each row execute function public.enforce_post_locked();

-- 6. Reputation calculation trigger (upvote = +1, downvote = -1)
create or replace function public.handle_reputation()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.post_id is not null then
      update public.profiles set reputation = reputation + NEW.value
      where id = (select author_id from public.posts where id = NEW.post_id);
    elsif NEW.comment_id is not null then
      update public.profiles set reputation = reputation + NEW.value
      where id = (select author_id from public.comments where id = NEW.comment_id);
    end if;
    return NEW;
  elsif TG_OP = 'DELETE' then
    if OLD.post_id is not null then
      update public.profiles set reputation = reputation - OLD.value
      where id = (select author_id from public.posts where id = OLD.post_id);
    elsif OLD.comment_id is not null then
      update public.profiles set reputation = reputation - OLD.value
      where id = (select author_id from public.comments where id = OLD.comment_id);
    end if;
    return OLD;
  end if;
end;
$$ language plpgsql security definer;

create trigger on_reputation_change
  after insert or delete on public.votes
  for each row execute function public.handle_reputation();
