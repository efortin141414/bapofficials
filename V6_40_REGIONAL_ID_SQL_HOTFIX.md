# V6.40 — Regional ID SQL Hotfix

Fixes Supabase error:

`ERROR 42702: column reference "issue_year" is ambiguous`

The PL/pgSQL variable `issue_year` conflicted with the
`member_id_counters.issue_year` column.

The corrected migration renames local variables with `v_` prefixes and aliases
the counter table during the UPSERT.

## Existing database

Open a NEW Supabase SQL Editor query and run:

`supabase/18_REGIONAL_ID_AMBIGUOUS_YEAR_HOTFIX.sql`

Then check the final `remaining_mid_ids` result.

Expected: `0`, except records without a Region.
