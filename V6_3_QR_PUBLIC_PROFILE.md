# V6.3 — QR Code Opens Membership Profile

Every membership ID QR code now opens the member's official public membership profile.

Example:
`https://YOUR-DOMAIN/profile/BAP-MID-2026-000001`

The profile shows only:
- Member photo
- Full name
- Position / designation
- Unique Membership ID Number
- Control Number
- Region
- Chapter
- Membership status
- Date issued
- Valid-until date
- Digital front ID

It does NOT expose:
- Mobile number
- Email address
- Emergency contact
- Emergency mobile/email
- Private member signature

## Existing V6.2 database
Run:
`supabase/04_QR_PUBLIC_PROFILE.sql`

once in Supabase SQL Editor.

Then deploy the V6.3 website files to GitHub/Vercel.

New IDs and certificates will generate QR codes that go directly to `/profile/{member_id_number}`.
