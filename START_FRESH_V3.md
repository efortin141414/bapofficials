# BAP National Membership System — FRESH V3

This is the clean START FROM ZERO build.

## What is included
- Member registration/login
- Membership application
- National Admin / Master Access
- Regional Admin
- QR verification
- Printable National Membership ID
- Printable Membership Certificate
- Member photo/signature uploads
- National and Regional signatories
- Payments/status/renewal controls
- Master-managed Positions database

## Master Positions Database
From `/master-access` > `Positions`, the National Master Administrator can:
- Add positions
- Edit position names
- Assign a category
- Set display order
- Activate/deactivate positions
- Delete positions

Active positions automatically become available in the Membership Application.

## START FROM ZERO ORDER

1. Create a brand-new Supabase project.
2. Run `supabase/01_FRESH_SUPABASE_SETUP.sql` ONCE.
3. Deploy this project to GitHub + Vercel.
4. Open the website.
5. The first-run setup form will ask for:
   - New Supabase Project URL
   - Publishable/anon public key
6. Click `Test & Connect New Supabase`.
7. Open `/connection-test` and confirm `Connected successfully`.
8. Create the Master account in Supabase Authentication.
9. Edit and run `supabase/02_PROMOTE_MASTER.sql`.
10. Login at `/master-login`.

## SECURITY
Never place these in the website:
- sb_secret keys
- service_role keys
- database passwords
- Master user password

The browser only needs a Supabase Project URL and Publishable/anon public key.
