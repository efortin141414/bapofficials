-- BAPTO Region + Chapter Gallery Upgrade
-- Run this once in Supabase SQL Editor before deploying the matching website files.

alter table public.gallery
  add column if not exists chapter_id uuid references public.chapters(id) on delete set null;

alter table public.regional_posters
  add column if not exists chapter_id uuid references public.chapters(id) on delete set null;

create index if not exists gallery_chapter_idx on public.gallery(chapter_id);
create index if not exists posters_chapter_idx on public.regional_posters(chapter_id);

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

-- Existing records remain regional-level because chapter_id stays NULL.
-- New records can be assigned to a chapter from Master Admin.
