# V6.41 — Final Year Ambiguity Fix

This fixes the remaining PostgreSQL ambiguity around the `issue_year` name.

Main changes:
- local function variable renamed to `v_year`
- migration block variable renamed to `v_year_existing`
- UPSERT uses `ON CONFLICT ON CONSTRAINT member_id_counters_pkey`
- table aliases are explicit

Run `supabase/18_REGIONAL_ID_YEAR_AMBIGUITY_FINAL_FIX.sql`
in a NEW Supabase SQL Editor query.
