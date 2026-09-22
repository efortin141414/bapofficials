# V6.48 — Edge Function Connection Fix

This update addresses the generic browser error:

`Failed to send a request to the Edge Function.`

## Changes

- Adds `supabase/config.toml` with `verify_jwt = false` for `member-email-notifications` so scheduled worker calls authenticated with `x-worker-secret` can reach the function.
- The Edge Function still performs its own authorization and accepts only a signed-in National Admin or the matching `EMAIL_WORKER_SECRET`.
- Adds compatibility with both legacy `SUPABASE_SERVICE_ROLE_KEY` and newer `SUPABASE_SECRET_KEYS` Supabase environments.
- Improves the Master Access error message so HTTP/Edge Function details are easier to diagnose.

## Most important deployment step

Running SQL does NOT deploy an Edge Function. The function must separately exist under:

`Supabase Dashboard → Edge Functions → member-email-notifications`

Deploy the function from `supabase/functions/member-email-notifications/index.ts` and ensure the function is in the same Supabase project used by the website's `VITE_SUPABASE_URL`.

## Required custom secrets

- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO` (optional but recommended)
- `EMAIL_WORKER_SECRET`
- `PUBLIC_SITE_URL`

Supabase provides its own project URL/admin key environment variables to hosted Edge Functions; V6.48 supports both legacy and new key formats.
