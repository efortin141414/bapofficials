# V6.37 — Regional Membership ID Number

The generic `MID` code is replaced for newly issued IDs.

## New format

- NCR: `BAP-NCR-2026-000001`
- CAR: `BAP-CAR-2026-000001`
- Region III: `BAP-R3-2026-000001`
- Region V: `BAP-R5-2026-000001`
- Region VIII: `BAP-R8-2026-000001`

Each Region receives its own numbering sequence per year.

Example:

`BAP-R5-2026-000001`
`BAP-R5-2026-000002`

while NCR can independently have:

`BAP-NCR-2026-000001`

## Existing IDs

Existing IDs such as `BAP-MID-2026-000123` are intentionally NOT automatically
renumbered. This protects existing printed cards and QR/profile links.

All NEW membership IDs issued after running the V6.37 SQL use the regional
format.

## QR synchronization

The QR logic continues to use the member's actual `member_id_number`, so new
regional IDs automatically direct to:

`/profile/BAP-NCR-2026-000001`

or the applicable regional code.

## Existing database

Run once:

`supabase/16_REGIONAL_MEMBER_ID.sql`

Then deploy V6.37.

## Fresh database

The latest `01_FRESH_SUPABASE_SETUP.sql` has also been updated to create
regional member IDs automatically.
