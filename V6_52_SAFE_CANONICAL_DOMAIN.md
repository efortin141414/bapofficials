# V6.52 — Safe Canonical Domain / Vercel Setup

This release prevents the membership system from generating new QR codes that point to the old parked `bapofficial.ph` domain.

## QR domain behavior

- If `VITE_PUBLIC_SITE_URL` is a valid HTTPS domain, the app uses it.
- `bapofficial.ph` and every subdomain such as `members.bapofficial.ph` are explicitly rejected.
- If the environment variable is missing, invalid, or points to the parked `.ph` domain, QR codes fall back to:
  `https://bap-membership-system-fresh-v3.vercel.app`
- Once `www.bapofficial.com` is Valid Configuration in Vercel, set:
  `VITE_PUBLIC_SITE_URL=https://www.bapofficial.com`
  and redeploy Production.

## Important limitation

A QR code already physically printed with `members.bapofficial.ph` cannot be changed by a Vercel code deployment. That exact `.ph` domain would have to be registered and connected to Vercel, or the printed QR must be regenerated.

## SQL

No SQL migration is required.
