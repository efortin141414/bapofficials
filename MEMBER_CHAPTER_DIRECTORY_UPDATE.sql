-- BAPTO Member / Chapter Directory performance helper
-- Safe to run more than once. No existing records are deleted or changed.
create index if not exists members_chapter_idx on public.members(chapter_id);
create index if not exists members_region_chapter_active_idx on public.members(region_id, chapter_id, active, public_profile);
