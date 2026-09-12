-- BAPTO Regions & Chapters Directory update
-- Run this in Supabase > SQL Editor only if your existing project does not already have the regions/chapters tables and policies.

create extension if not exists pgcrypto;

create table if not exists public.regions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  sort_order integer not null default 999,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references public.regions(id) on delete cascade,
  name text not null,
  chapter_type text default 'chapter',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(region_id,name)
);

alter table public.regions enable row level security;
alter table public.chapters enable row level security;

drop policy if exists "regions public read" on public.regions;
create policy "regions public read" on public.regions for select using (active=true);
drop policy if exists "regions master write" on public.regions;
create policy "regions master write" on public.regions for all to authenticated using (public.is_master_admin()) with check (public.is_master_admin());

drop policy if exists "chapters public read" on public.chapters;
create policy "chapters public read" on public.chapters for select using (active=true);
drop policy if exists "chapters admin write" on public.chapters;
create policy "chapters admin write" on public.chapters for all to authenticated using (public.is_master_admin() or public.is_regional_admin_for(region_id)) with check (public.is_master_admin() or public.is_regional_admin_for(region_id));
