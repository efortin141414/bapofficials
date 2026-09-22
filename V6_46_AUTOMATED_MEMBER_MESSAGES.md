# V6.46 — Automated Member Messages

Automatic member email lifecycle messaging now includes:

1. **New Member Registration** — sent automatically when a member record with an email address is created.
2. **Digital ID Ready** — sent automatically when payment is confirmed, the membership becomes active, and the Membership ID is issued.
3. **Physical ID Ready for Release** — Master Access now has an **ID Ready for Release** button. Clicking it queues the release email automatically.
4. **Expiry Reminders** — 30 days, 7 days, 1 day, and on the expiration date.
5. **Expired Membership / License** — overdue active records are automatically marked `expired`, and one renewal-required email is queued.

## Master ID release workflow

- Active member + issued Membership ID → click **ID Ready for Release**.
- Member receives: **Your BAP National ID Is Ready for Release**.
- After claiming → click **Mark ID Released**.

## Existing database

Run once:

`supabase/21_AUTOMATED_MEMBER_MESSAGES.sql`

Then redeploy the existing `member-email-notifications` Supabase Edge Function.

The Edge Function should continue running on a schedule (recommended every 5 minutes).

## Required secrets

- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO`
- `EMAIL_WORKER_SECRET`
- `PUBLIC_SITE_URL=https://bap-membership-system-fresh-v3.vercel.app` (use this until your custom domain is Valid, then change to `https://www.bapofficial.com`)

No API or provider secret is placed in the React/Vercel frontend.
