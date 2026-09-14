-- ============================================================
-- BAPTO MASTER ADMIN DATABASE SETUP (SUPABASE)
-- Run this ONCE in Supabase > SQL Editor.
-- Then create your Master Admin user in Authentication > Users.
-- See SETUP_MASTER_ADMIN.md for the final profile step.
-- ============================================================

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create table if not exists public.regions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  sort_order integer not null default 999,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.regions(code,name,sort_order) values
('NCR','National Capital Region',1),
('CAR','Cordillera Administrative Region',2),
('I','Ilocos Region',3),
('II','Cagayan Valley',4),
('III','Central Luzon',5),
('IV-A','CALABARZON',6),
('MIMAROPA','MIMAROPA Region',7),
('V','Bicol Region',8),
('VI','Western Visayas',9),
('NIR','Negros Island Region',10),
('VII','Central Visayas',11),
('VIII','Eastern Visayas',12),
('IX','Zamboanga Peninsula',13),
('X','Northern Mindanao',14),
('XI','Davao Region',15),
('XII','SOCCSKSARGEN',16),
('XIII','Caraga',17),
('BARMM','Bangsamoro Autonomous Region in Muslim Mindanao',18)
on conflict(code) do update set name=excluded.name, sort_order=excluded.sort_order;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'member' check (role in ('master_admin','regional_admin','member')),
  region_id uuid references public.regions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_master_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='master_admin');
$$;

create or replace function public.is_regional_admin_for(target_region uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='regional_admin' and p.region_id=target_region);
$$;

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references public.regions(id) on delete cascade,
  name text not null,
  chapter_type text default 'chapter',
  locality_code text,
  locality_name text,
  locality_type text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(region_id,name)
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  body text,
  event_date date,
  image_url text,
  published boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  album_name text not null,
  caption text,
  region_id uuid references public.regions(id) on delete set null,
  chapter_id uuid references public.chapters(id) on delete set null,
  event_date date,
  image_url text not null,
  published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regional_posters (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references public.regions(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete set null,
  title text,
  person_name text not null,
  position text,
  caption text,
  image_url text not null,
  published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Compatibility for existing projects upgraded from earlier versions.
alter table public.gallery add column if not exists chapter_id uuid references public.chapters(id) on delete set null;
alter table public.regional_posters add column if not exists chapter_id uuid references public.chapters(id) on delete set null;

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  member_id text not null unique,
  first_name text not null,
  middle_name text,
  last_name text not null,
  suffix text,
  region_id uuid not null references public.regions(id) on delete restrict,
  chapter_id uuid references public.chapters(id) on delete set null,
  locality_code text,
  locality_name text,
  locality_type text,
  position text,
  accreditation_level text,
  photo_url text,
  joined_on date,
  valid_until date,
  active boolean not null default true,
  public_profile boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- City / Municipality compatibility for projects upgraded from earlier versions.
alter table public.chapters add column if not exists locality_code text;
alter table public.chapters add column if not exists locality_name text;
alter table public.chapters add column if not exists locality_type text;
alter table public.members add column if not exists locality_code text;
alter table public.members add column if not exists locality_name text;
alter table public.members add column if not exists locality_type text;
create index if not exists chapters_region_locality_idx on public.chapters(region_id, locality_code);
create index if not exists members_region_locality_chapter_idx on public.members(region_id, locality_code, chapter_id);

-- Every member validity automatically follows Date Joined + 2 calendar years.
create or replace function public.set_member_two_year_validity()
returns trigger language plpgsql set search_path=public as $$
begin
  if new.joined_on is null then new.joined_on := current_date; end if;
  if tg_op = 'INSERT' or new.joined_on is distinct from old.joined_on or new.valid_until is null then
    new.valid_until := (new.joined_on + interval '2 years')::date;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_member_two_year_validity on public.members;
create trigger trg_member_two_year_validity
before insert or update on public.members
for each row execute function public.set_member_two_year_validity();


-- Ensure a selected chapter always belongs to the selected region.
create or replace function public.enforce_chapter_region_match()
returns trigger language plpgsql set search_path=public as $$
begin
  if new.chapter_id is not null then
    if new.region_id is null or not exists (
      select 1 from public.chapters c where c.id = new.chapter_id and c.region_id = new.region_id
    ) then
      raise exception 'Selected chapter does not belong to selected region';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_gallery_chapter_region on public.gallery;
create trigger trg_gallery_chapter_region before insert or update on public.gallery
for each row execute function public.enforce_chapter_region_match();

drop trigger if exists trg_posters_chapter_region on public.regional_posters;
create trigger trg_posters_chapter_region before insert or update on public.regional_posters
for each row execute function public.enforce_chapter_region_match();

drop trigger if exists trg_members_chapter_region on public.members;
create trigger trg_members_chapter_region before insert or update on public.members
for each row execute function public.enforce_chapter_region_match();

create table if not exists public.seminars (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  region_id uuid references public.regions(id) on delete set null,
  venue text,
  starts_on date,
  ends_on date,
  details text,
  poster_url text,
  published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.national_officers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position text not null,
  bio text,
  photo_url text,
  sort_order integer not null default 999,
  published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists trg_announcements_updated on public.announcements;
create trigger trg_announcements_updated before update on public.announcements for each row execute function public.set_updated_at();
drop trigger if exists trg_gallery_updated on public.gallery;
create trigger trg_gallery_updated before update on public.gallery for each row execute function public.set_updated_at();
drop trigger if exists trg_posters_updated on public.regional_posters;
create trigger trg_posters_updated before update on public.regional_posters for each row execute function public.set_updated_at();
drop trigger if exists trg_members_updated on public.members;
create trigger trg_members_updated before update on public.members for each row execute function public.set_updated_at();

alter table public.regions enable row level security;
alter table public.profiles enable row level security;
alter table public.chapters enable row level security;
alter table public.announcements enable row level security;
alter table public.gallery enable row level security;
alter table public.regional_posters enable row level security;
alter table public.members enable row level security;
alter table public.seminars enable row level security;
alter table public.national_officers enable row level security;

-- Regions / chapters: public read, master write.
drop policy if exists "regions public read" on public.regions;
create policy "regions public read" on public.regions for select using (active=true);
drop policy if exists "regions master write" on public.regions;
create policy "regions master write" on public.regions for all to authenticated using (public.is_master_admin()) with check (public.is_master_admin());

drop policy if exists "chapters public read" on public.chapters;
create policy "chapters public read" on public.chapters for select using (active=true);
drop policy if exists "chapters admin write" on public.chapters;
create policy "chapters admin write" on public.chapters for all to authenticated using (public.is_master_admin() or public.is_regional_admin_for(region_id)) with check (public.is_master_admin() or public.is_regional_admin_for(region_id));

-- Profiles: user can read self; master can manage profiles.
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles for select to authenticated using (id=auth.uid() or public.is_master_admin());
drop policy if exists "profiles master write" on public.profiles;
create policy "profiles master write" on public.profiles for all to authenticated using (public.is_master_admin()) with check (public.is_master_admin());

-- Announcements: published public, master only writes.
drop policy if exists "announcements public read" on public.announcements;
create policy "announcements public read" on public.announcements for select using (published=true or public.is_master_admin());
drop policy if exists "announcements master insert" on public.announcements;
create policy "announcements master insert" on public.announcements for insert to authenticated with check (public.is_master_admin());
drop policy if exists "announcements master update" on public.announcements;
create policy "announcements master update" on public.announcements for update to authenticated using (public.is_master_admin()) with check (public.is_master_admin());
drop policy if exists "announcements master delete" on public.announcements;
create policy "announcements master delete" on public.announcements for delete to authenticated using (public.is_master_admin());

-- Gallery: published public. Master controls all; regional admin only their region.
drop policy if exists "gallery public read" on public.gallery;
create policy "gallery public read" on public.gallery for select using (published=true or public.is_master_admin() or public.is_regional_admin_for(region_id));
drop policy if exists "gallery admin insert" on public.gallery;
create policy "gallery admin insert" on public.gallery for insert to authenticated with check (public.is_master_admin() or public.is_regional_admin_for(region_id));
drop policy if exists "gallery admin update" on public.gallery;
create policy "gallery admin update" on public.gallery for update to authenticated using (public.is_master_admin() or public.is_regional_admin_for(region_id)) with check (public.is_master_admin() or public.is_regional_admin_for(region_id));
drop policy if exists "gallery admin delete" on public.gallery;
create policy "gallery admin delete" on public.gallery for delete to authenticated using (public.is_master_admin() or public.is_regional_admin_for(region_id));

-- Regional posters.
drop policy if exists "posters public read" on public.regional_posters;
create policy "posters public read" on public.regional_posters for select using (published=true or public.is_master_admin() or public.is_regional_admin_for(region_id));
drop policy if exists "posters admin insert" on public.regional_posters;
create policy "posters admin insert" on public.regional_posters for insert to authenticated with check (public.is_master_admin() or public.is_regional_admin_for(region_id));
drop policy if exists "posters admin update" on public.regional_posters;
create policy "posters admin update" on public.regional_posters for update to authenticated using (public.is_master_admin() or public.is_regional_admin_for(region_id)) with check (public.is_master_admin() or public.is_regional_admin_for(region_id));
drop policy if exists "posters admin delete" on public.regional_posters;
create policy "posters admin delete" on public.regional_posters for delete to authenticated using (public.is_master_admin() or public.is_regional_admin_for(region_id));

-- Members: only safe public profile fields should be queried by the public website.
drop policy if exists "members public read" on public.members;
create policy "members public read" on public.members for select using ((active=true and public_profile=true) or public.is_master_admin() or public.is_regional_admin_for(region_id));
drop policy if exists "members admin insert" on public.members;
create policy "members admin insert" on public.members for insert to authenticated with check (public.is_master_admin() or public.is_regional_admin_for(region_id));
drop policy if exists "members admin update" on public.members;
create policy "members admin update" on public.members for update to authenticated using (public.is_master_admin() or public.is_regional_admin_for(region_id)) with check (public.is_master_admin() or public.is_regional_admin_for(region_id));
drop policy if exists "members admin delete" on public.members;
create policy "members admin delete" on public.members for delete to authenticated using (public.is_master_admin() or public.is_regional_admin_for(region_id));

-- Seminars.
drop policy if exists "seminars public read" on public.seminars;
create policy "seminars public read" on public.seminars for select using (published=true or public.is_master_admin() or public.is_regional_admin_for(region_id));
drop policy if exists "seminars admin write" on public.seminars;
create policy "seminars admin write" on public.seminars for all to authenticated using (public.is_master_admin() or public.is_regional_admin_for(region_id)) with check (public.is_master_admin() or public.is_regional_admin_for(region_id));

-- National officers: public read, master write.
drop policy if exists "national officers public read" on public.national_officers;
create policy "national officers public read" on public.national_officers for select using (published=true or public.is_master_admin());
drop policy if exists "national officers master write" on public.national_officers;
create policy "national officers master write" on public.national_officers for all to authenticated using (public.is_master_admin()) with check (public.is_master_admin());

-- Storage bucket used by admin uploads.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('media','media',true,10485760,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict(id) do update set public=true, file_size_limit=10485760, allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif'];

drop policy if exists "media public view" on storage.objects;
create policy "media public view" on storage.objects for select using (bucket_id='media');
drop policy if exists "media admin upload" on storage.objects;
create policy "media admin upload" on storage.objects for insert to authenticated with check (bucket_id='media' and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('master_admin','regional_admin')));
drop policy if exists "media admin update" on storage.objects;
create policy "media admin update" on storage.objects for update to authenticated using (bucket_id='media' and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('master_admin','regional_admin'))) with check (bucket_id='media');
drop policy if exists "media admin delete" on storage.objects;
create policy "media admin delete" on storage.objects for delete to authenticated using (bucket_id='media' and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('master_admin','regional_admin')));

-- Helpful indexes.
create index if not exists members_region_idx on public.members(region_id);
create index if not exists members_chapter_idx on public.members(chapter_id);
create index if not exists members_region_chapter_active_idx on public.members(region_id,chapter_id,active,public_profile);
create index if not exists members_name_idx on public.members(last_name,first_name);
create index if not exists posters_region_idx on public.regional_posters(region_id);
create index if not exists posters_chapter_idx on public.regional_posters(chapter_id);
create index if not exists gallery_region_idx on public.gallery(region_id);
create index if not exists gallery_chapter_idx on public.gallery(chapter_id);
