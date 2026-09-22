# V6.15 — Inline Payment QR Fix

The screenshot showing alt text such as `BDO membership payment QR code`
means the deployed page was still using broken image paths.

V6.15 removes payment QR images from the runtime completely.

The BDO, UnionBank, GCash and Maya payment payloads are rendered directly with
the existing `QRCodeSVG` component already used by the membership ID system.

Advantages:
- no `/payments/...` file path
- no `/payments-clean/...` path
- no external image loading
- no data-URI image dependency
- works on Vercel preview and production domains
- responsive on desktop and mobile

Each payment card includes:
- live SVG payment QR
- account/recipient label
- total amount due
- Open QR Full Size
- Download QR

No new Supabase SQL migration is required if V6.13 is already installed.

IMPORTANT DEPLOYMENT CHECK:
If your page still says `Open QR Full Size` beneath a blank image box and does
not show the green `V6.15 Payment QR Fix` notice, Vercel is still serving an
older deployment. Make sure the V6.15 files replace the existing repository
files at the GitHub repository root and redeploy the latest commit.
