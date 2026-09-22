# V6.45 — Automated Member Email Notifications

V6.45 adds transactional email notifications for members.

## Automatic member emails

1. **Registration received** — sent after a new online membership account is created.
2. **Membership ID ready** — queued when the member becomes Active and the Membership ID is issued.
3. **Expiry reminders** — queued 30 days, 7 days, 1 day, and on the expiration date.

## Architecture

- PostgreSQL triggers/events only **queue** email notifications.
- A Supabase Edge Function sends queued messages through **Resend**.
- The provider API key remains in **Supabase Edge Function Secrets**, never in React/Vercel frontend code.
- Unique event keys prevent duplicate notifications.
- Failed deliveries retry up to 5 times.

## Master Access

A new **Email Notifications** tab shows the latest queue, Sent/Pending/Failed status, attempts, and a **Run Email Worker Now** button.

## Existing database setup

1. Run `supabase/20_MEMBER_EMAIL_NOTIFICATIONS.sql` once.
2. Configure Edge Function secrets.
3. Deploy `member-email-notifications` with `--no-verify-jwt`.
4. Schedule a POST call every 5 minutes with `x-worker-secret`.

See `supabase/functions/member-email-notifications/README.md` for exact setup.
