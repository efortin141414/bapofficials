# V6.12 — Payment QR Visibility + Official Organizational Hierarchy

## Payment QR Fix

The four payment QR images are now embedded directly into the application build
through `payment-assets.js`.

This removes dependence on `/public/payments/...` URLs at runtime.

Payment page shows:
- BDO
- UnionBank
- GCash
- Maya

Each QR is displayed inside a high-visibility `SCAN TO PAY` panel and retains
an `Open QR Full Size` action.

## Official Organizational Hierarchy

The Organization module now follows exactly:

1. President
2. Vice President
3. National Commissioner
4. Secretary General
5. Regional Leadership
6. Provincial Leadership
7. Municipal Leadership

The database migration also normalizes the relevant position categories and
sort order.

## Existing Supabase Project

Run once:

`supabase/09_PAYMENT_QR_ORG_HIERARCHY.sql`

Then deploy V6.12 to GitHub/Vercel.

## Important

The organizational chart only displays active members assigned to these
official leadership positions. If a level shows `Position not yet assigned`,
assign an active member to that position from Master Access.
