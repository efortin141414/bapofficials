# V6.34 — Featured Leadership Posters + Premium Website

This update uses the seven supplied Commissioner / Director poster images as
featured public website content and upgrades the Home and About Us pages.

## Added poster files
Stored under:
`public/featured-leadership/`

The public poster gallery now combines:
- Active posters uploaded by Master Access
- Built-in featured leadership posters supplied for V6.34

This means the website has visible leadership content even before additional
posters are uploaded into Supabase.

## Landing Page upgrades
- Premium dark navy / gold / blue hero
- Leadership poster showcase
- Strong membership calls-to-action
- Organization story section
- Discipline / Integrity / Unity / Development value cards
- Leadership Across the Philippines poster strip
- Existing Executive Dashboard
- Existing membership CTA and public poster gallery

## About Us upgrades
- High-impact visual hero with leadership posters
- Who We Are
- Our Purpose / Commitment / Community
- Core values:
  Discipline, Integrity, Fair Play, Unity, Leadership, Development
- Leadership in Action poster showcase
- National membership / accreditation / QR verification / leadership platform

## Poster upload support
Master Access Poster Manager continues to accept:
- PNG
- JPG / JPEG
- WebP
- Up to 12 MB

Portrait layouts such as 3:4 and 4:5 are explicitly supported and now preview
with `object-fit: contain` to prevent important poster content from being
cropped.

## SQL
No new SQL is required for V6.34 itself.

If the leadership poster database was not yet installed, use the previously
provided combined poster-table fix before using dynamic poster uploads.
