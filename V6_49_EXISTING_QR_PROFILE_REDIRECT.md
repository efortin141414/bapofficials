# V6.49 — Existing QR → Public Profile Redirect Fix

This update preserves older printed/generated QR codes and sends them to the current public member profile.

## Supported legacy QR formats

- `/verify/{Membership ID or Control Number}` → `/profile/{identifier}`
- `/qr/{identifier}` → `/profile/{identifier}`
- `/id/{identifier}` → `/profile/{identifier}`
- `/member-profile/{identifier}` → `/profile/{identifier}`
- Query-string legacy links such as `/verify?control=...`, `/verify?id=...`, `/verify?member_id=...`, and `/verify?identifier=...`

## Important

Existing printed QR codes do **not** need to be regenerated when they point to a domain that still reaches this Vercel project. Vercel now redirects legacy QR paths before the React app loads, and React also keeps a fallback redirect for compatibility.

If an old QR points to a parked or expired domain that you do not control, software inside this project cannot intercept that scan. That old domain must first be connected/redirected to this Vercel project.

## New QR codes

New ID, profile, certificate, directory, Master, and Excel QR codes continue to encode the canonical `/profile/{identifier}` destination.

## SQL

No SQL migration is required for V6.49.
