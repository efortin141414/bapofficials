# BAP Membership System — FRESH V4

## New Master Access Feature: Membership Database + Create Profile

The National Master Administrator can now open:

`/master-access`

and use:

- Membership Database
- + Create Profile
- Positions
- User Access
- Signatories & Regions

### Create Profile

The Master can manually encode a member even if the person does not have a website login.

The profile supports:

- Full name
- Position
- Custom designation
- Region
- Chapter
- Mobile
- Email
- Payment status
- Member photo
- Member signature
- Emergency contact
- Emergency relationship
- Emergency mobile
- Emergency email
- Optional immediate approval and issuance

If `Approve now and issue control number / 2-year membership` is checked,
the system automatically calls the approval process and generates the official
control number and two-year validity.

Manual records are marked `MASTER CREATED` in the Membership Database.

## Fresh Install

This package is for a BRAND-NEW Supabase project.

Run only:

`supabase/01_FRESH_SUPABASE_SETUP.sql`

once.

Then create your Master user in Supabase Authentication and run:

`supabase/02_PROMOTE_MASTER.sql`

after replacing the placeholder email.

Do not use old repair SQL scripts with this package.
