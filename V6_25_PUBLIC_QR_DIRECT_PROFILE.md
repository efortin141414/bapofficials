# V6.25 — Public QR Direct to Profile

## Goal
Every official member QR opens the member's public profile directly:

`https://bap-membership-system-fresh-v3.vercel.app/profile/{MEMBERSHIP_ID}`

No Member login is required.

## What changed
- QR codes now use the canonical public production URL by default.
- QR codes no longer fall back to the current browser origin.
- This prevents QR codes created from a Vercel preview URL from sending users
  to a deployment that may require Vercel authentication.
- The public profile route is accessible without application login.

## Vercel setting
Frontend code cannot disable Vercel Deployment Protection.

If the Production deployment itself is protected:
- Vercel Project → Settings → Deployment Protection
- Make Production public / disable Vercel Authentication for Production.
- Preview deployments may remain protected if desired.

Recommended environment variable:
`VITE_PUBLIC_SITE_URL=https://bap-membership-system-fresh-v3.vercel.app`

## SQL
No SQL migration is required.
