# V6.42 — Unified Membership ID / Control Number Search

The website now uses the same public search workflow for:

- Member Name
- Membership ID Number
- Control Number
- Legacy BAP-MID Number

## Verify ID page

One field accepts either:

`BAP-NCR-2026-000001`

or:

`BAP-NTO-NCR-2026-000001`

Both open the same official member profile.

## Membership Directory

The directory's main search field now accepts:
- Name
- Membership ID
- Control Number
- Old Membership ID alias

The member card also displays both the Membership ID and Control Number.

## Existing database

Run once:

`supabase/19_UNIFIED_ID_CONTROL_SEARCH.sql`

No existing member numbers are changed by this migration.
