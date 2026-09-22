# V6.20 — Public Membership Directory

New public module:

`/membership-directory`

## Search
Visitors can search by:
- First name
- Last name
- Any part of the full name
- Region

A Region dropdown includes all configured regions.

## Directory Cards
Only currently active official members are listed.

Each card shows:
- Member photo
- Full name
- Position / designation
- Region
- Chapter
- Membership ID
- Valid-until date
- View Official Profile

## Privacy
The directory does NOT return or display:
- Mobile number
- Email
- Emergency contacts
- Payment information
- Member signature
- Other private administration fields

## Existing Supabase Project

Run once:

`supabase/12_MEMBERSHIP_DIRECTORY_SEARCH.sql`

Then deploy V6.20 to GitHub/Vercel.

## Search behavior
The name search uses a case-insensitive partial match on the member's full name.
For example:
- `Juan`
- `Dela Cruz`
- `Fortin`

will match those words wherever they appear in the full name.
