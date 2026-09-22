# V6.53 — Original Vercel QR Lock

This release forces every membership/profile QR code back to the original stable Vercel production domain:

`https://bap-membership-system-fresh-v3.vercel.app`

## What changed

- All member QR destinations are locked to the original Vercel production URL.
- `VITE_PUBLIC_SITE_URL` can no longer accidentally switch QR codes to an unregistered or parked domain.
- Digital ID, Profile, Certificate, Directory, Master and Excel QR generation all continue to use the same shared QR generator.
- QR rendering uses black-on-white high-contrast output with error correction level H.
- Digital ID QR display was enlarged and given a larger white quiet zone to improve camera scanning.

## QR destination format

`https://bap-membership-system-fresh-v3.vercel.app/profile/{MEMBERSHIP-ID}`

Example:

`https://bap-membership-system-fresh-v3.vercel.app/profile/BAP-NCR-2026-000001`

## SQL

No SQL migration is required.

## Important

Already printed QR codes that physically contain `members.bapofficial.ph` cannot be changed remotely. Re-open/reprint the Digital ID after deploying this release so the newly generated QR contains the original Vercel URL.
