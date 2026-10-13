

-- ===== 2026-10 Upcoming Events + Facebook integration =====
alter table public.seminars add column if not exists event_type text;
alter table public.seminars add column if not exists registration_url text;
alter table public.seminars add column if not exists facebook_event_url text;
alter table public.seminars add column if not exists featured boolean not null default false;
alter table public.announcements add column if not exists facebook_post_id text;
alter table public.announcements add column if not exists facebook_posted_at timestamptz;

create table if not exists public.site_settings (
  id text primary key default 'public',
  facebook_page_url text,
  facebook_group_url text,
  updated_at timestamptz not null default now()
);
insert into public.site_settings(id) values('public') on conflict(id) do nothing;
alter table public.site_settings enable row level security;
drop policy if exists "site settings public read" on public.site_settings;
create policy "site settings public read" on public.site_settings for select using (true);
drop policy if exists "site settings master write" on public.site_settings;
create policy "site settings master write" on public.site_settings for all to authenticated using (public.is_master_admin()) with check (public.is_master_admin());

create index if not exists seminars_public_date_idx on public.seminars(published, featured desc, starts_on);
