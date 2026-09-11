-- BAPTO Master Admin login repair / bootstrap
-- Run AFTER database.sql in Supabase > SQL Editor.

-- 1) Make sure the front-end roles can access the public schema/tables.
grant usage on schema public to anon, authenticated;
grant select on public.regions to anon, authenticated;
grant select on public.chapters to anon, authenticated;
grant select on public.announcements to anon, authenticated;
grant select on public.gallery to anon, authenticated;
grant select on public.regional_posters to anon, authenticated;
grant select on public.members to anon, authenticated;
grant select on public.seminars to anon, authenticated;
grant select on public.national_officers to anon, authenticated;
grant select on public.profiles to authenticated;
grant insert, update, delete on public.announcements, public.gallery, public.regional_posters, public.members, public.seminars, public.chapters to authenticated;
grant insert, update, delete on public.regions, public.national_officers, public.profiles to authenticated;

-- 2) Promote the specified Auth user to Master Admin if the user already exists.
insert into public.profiles (id, full_name, role)
select id, 'BAPTO National Admin', 'master_admin'
from auth.users
where lower(email) = lower('bapnationalcom@gmail.com')
on conflict (id) do update
set full_name = excluded.full_name,
    role = 'master_admin',
    updated_at = now();

-- 3) Verify. This should return ONE row with role = master_admin.
select
  u.id,
  u.email,
  u.email_confirmed_at,
  p.full_name,
  p.role
from auth.users u
left join public.profiles p on p.id = u.id
where lower(u.email) = lower('bapnationalcom@gmail.com');
