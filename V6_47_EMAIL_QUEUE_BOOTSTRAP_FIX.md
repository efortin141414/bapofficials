# V6.47 — Email Queue Bootstrap Fix

Fixes:

`ERROR 42P01: relation "public.email_notifications" does not exist`

The V6.46 migration expected the V6.45 email queue table to already exist.
V6.47 combines the required bootstrap with the automated message migration.

## Existing database

Open a new Supabase SQL Editor query and run:

`supabase/22_EMAIL_NOTIFICATIONS_BOOTSTRAP_FIX.sql`

Do not run V6.45 and V6.46 separately if this combined migration succeeds.

It creates/installs:
- `public.email_notifications`
- queue indexes and Master-only read policy
- registration email queue trigger
- digital ID-ready notification
- physical ID-ready-for-release notification
- ID released tracking
- 30/7/1/0-day expiry reminders
- expired membership message
