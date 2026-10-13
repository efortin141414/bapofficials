-- Safe support columns for Facebook announcement publishing.
-- No UPDATE statement is used, so this does not trigger the Supabase 'UPDATE requires a WHERE clause' warning.

alter table public.announcements add column if not exists facebook_post_id text;
alter table public.announcements add column if not exists facebook_posted_at timestamptz;

create index if not exists announcements_facebook_pending_idx
on public.announcements (published, facebook_posted_at, created_at);
