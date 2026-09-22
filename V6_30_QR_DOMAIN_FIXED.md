# V6.30 — QR Domain Fixed

## Problem fixed
QR scans were opening `members.bapofficial.ph`, which is currently a parked /
unregistered domain. That means the QR itself was valid, but the URL encoded
inside it was wrong.

## Fix
All member QR codes are now forced to this public Production base URL:

`https://bap-membership-system-fresh-v3.vercel.app`

Every QR therefore resolves to:

`https://bap-membership-system-fresh-v3.vercel.app/profile/{MEMBERSHIP_ID_OR_CONTROL_NUMBER}`

This applies to:
- National Membership ID QR
- Membership Certificate QR
- Membership Directory QR
- Individual Public Profile QR
- National Membership Database / Excel ID-processing QR
- Master-generated QR codes

Legacy `/verify/...` links remain synchronized to the public profile.

## Important
Existing physical/printed QR codes that already contain
`members.bapofficial.ph` cannot be changed by a software update because the URL
is permanently encoded in the printed QR image. Those IDs must be reprinted
with the regenerated V6.30 QR, unless the custom domain is purchased and
redirected to the BAP application.

## SQL
No Supabase SQL migration is required.
