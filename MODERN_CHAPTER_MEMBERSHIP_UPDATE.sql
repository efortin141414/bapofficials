-- BAPTO: Modern Chapter Membership Update
-- Run once in Supabase SQL Editor before deploying the new website files.

alter table public.chapters add column if not exists locality_code text;
alter table public.chapters add column if not exists locality_name text;
alter table public.chapters add column if not exists locality_type text;

alter table public.members add column if not exists locality_code text;
alter table public.members add column if not exists locality_name text;
alter table public.members add column if not exists locality_type text;

create index if not exists chapters_region_locality_idx
  on public.chapters(region_id, locality_code);
create index if not exists members_region_locality_chapter_idx
  on public.members(region_id, locality_code, chapter_id);

create or replace function public.set_member_two_year_validity()
returns trigger
language plpgsql
set search_path=public
as $$
begin
  if new.joined_on is null then
    new.joined_on := current_date;
  end if;

  if tg_op = 'INSERT'
     or new.joined_on is distinct from old.joined_on
     or new.valid_until is null then
    new.valid_until := (new.joined_on + interval '2 years')::date;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_member_two_year_validity on public.members;
create trigger trg_member_two_year_validity
before insert or update on public.members
for each row execute function public.set_member_two_year_validity();

-- Backfill only members that do not yet have a validity date.
update public.members
set valid_until = (coalesce(joined_on,current_date) + interval '2 years')::date
where valid_until is null;
