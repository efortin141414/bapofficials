# V6.51 — Force Working QR Domain

This release fixes newly rendered QR codes that were still using an old or parked domain.

## What changed
- All member/profile QR codes now always encode the stable production URL:
  `https://bap-membership-system-fresh-v3.vercel.app/profile/{MEMBER_ID}`
- Old/broken `VITE_PUBLIC_SITE_URL` values are ignored for QR generation.
- ID QR, Profile QR, Certificate QR, Directory QR, Master QR and Excel QR exports stay synchronized.
- The in-app scanner can still extract a member identifier from legacy `/profile/...` or `/verify/...` QR URLs regardless of their hostname.

## Important limitation
A physically printed QR code that already contains `members.bapofficial.ph` cannot be changed by deploying new code. That domain is currently parked/unregistered. To make that exact printed QR work, the exact domain must be acquired and pointed to the Vercel project, or the physical QR must be reprinted.

## SQL
No SQL migration is required.
