# V6.29 — All QR Codes Direct to Public Profile

Every member QR in the system is now synchronized to one public destination:

`{PUBLIC_SITE_URL}/profile/{MEMBERSHIP_ID_OR_CONTROL_NUMBER}`

This applies to:
- National Membership ID QR
- Membership Certificate QR
- Membership Directory QR
- Individual Public Profile QR
- National Membership Database Excel / ID Processing QR
- QR codes generated in Master Access

Legacy `/verify/{control}` links now automatically redirect to the same public
profile, so previously generated verification links remain synchronized.

The Verify ID scanner also converts:
- `/profile/...` QR links
- legacy `/verify/...` QR links
- manually entered Membership IDs
- manually entered Control Numbers

into the public member profile.

No BAP member login is required for `/profile/:identifier`.

IMPORTANT:
If Vercel Deployment Protection is enabled on the Production deployment,
Vercel itself can still request a Vercel account login before the application
loads. Frontend code cannot bypass Vercel Deployment Protection. The Production
deployment/domain must be public.

Recommended environment variable:
`VITE_PUBLIC_SITE_URL=https://bap-membership-system-fresh-v3.vercel.app`

No Supabase SQL migration is required.
