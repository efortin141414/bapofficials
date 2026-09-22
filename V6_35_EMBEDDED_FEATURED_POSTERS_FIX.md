# V6.35 — Featured Poster Image Fix

## Why the posters could disappear
V6.34 referenced the seven built-in posters using public paths such as:

`/featured-leadership/paul-sabate-region-v.jpeg`

If the `public/featured-leadership` folder was not uploaded to GitHub, was
accidentally omitted, or the deployment did not include those static files,
the page loaded but the poster images returned 404 / broken-image results.

## Fix
V6.35 embeds all seven featured leadership posters directly inside
`featured-posters.js` as image data.

The landing page and About Us no longer depend on the
`public/featured-leadership` folder for those seven built-in posters.

The original files are still kept in `public/featured-leadership` as backup.

## Dynamic posters
Posters uploaded later from Master Access still load from their saved Supabase
Storage URLs. The public gallery now also includes a visual fallback if one of
those remote images fails to load.

## SQL
No new SQL is required for V6.35.
