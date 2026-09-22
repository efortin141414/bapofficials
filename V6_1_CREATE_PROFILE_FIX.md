# V6.1 — Master Create Profile RPC Fix

The error:

`Could not find the function public.create_manual_member(...) in the schema cache`

means the deployed website is calling the correct RPC name, but the current
Supabase database does not have that exact function signature available to
PostgREST yet.

## Fix existing Supabase project

In Supabase:

1. Open SQL Editor.
2. Create a New Query.
3. Open:
   `supabase/03_FIX_MASTER_CREATE_PROFILE_RPC.sql`
4. Copy the entire file.
5. Run it once.
6. The last query should list `create_manual_member` and `approve_member`.
7. Refresh `/master-access`.
8. Create the membership profile again.

The script also sends:

`NOTIFY pgrst, 'reload schema';`

so Supabase refreshes its API schema cache.

You do NOT need to delete your existing members or recreate the project for
this specific error.
