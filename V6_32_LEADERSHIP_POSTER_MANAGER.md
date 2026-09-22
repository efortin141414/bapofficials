# V6.32 — Commissioner & Director Poster Manager

New Master Access tab:

`Commissioner & Director Posters`

## Master-only features
- Upload Commissioner posters
- Upload Director posters
- Enter full name and official position
- Assign Region
- Add City / Province / Municipality
- Add caption / notes
- Set display order
- Set Active / Inactive status
- Preview and open uploaded poster
- Replace poster image
- Edit metadata
- Delete poster record

Poster images are stored in the existing public `member-assets` Storage bucket
inside the authenticated Master Admin folder. The poster database itself is
protected by Row Level Security and is available only to National Admin users.

## Existing Supabase project
Run once:

`supabase/14_LEADERSHIP_POSTER_MANAGER.sql`

Then deploy V6.32.

## Fresh Supabase project
The V6.32 package also patches `01_FRESH_SUPABASE_SETUP.sql` so the poster table
and policies are included in a brand-new installation.
