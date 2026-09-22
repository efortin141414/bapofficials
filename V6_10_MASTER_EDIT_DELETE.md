# V6.10 — Master Access Edit & Delete

New in Master Access:

## Edit Member
From either:
- Membership Database
- Regional Database

click `Edit`.

Master Administrator can update:
- Full name
- Position
- Region
- Chapter
- Mobile
- Email
- Membership status
- Payment status
- Member photo
- Member signature
- Emergency contact details

Protected system-generated values cannot be edited manually:
- Form Code
- Membership ID Number
- Control Number
- Issue Date
- Valid Until

## Delete Membership Record
Each member row now has a `Delete` action.

Deletion requires:
1. confirmation dialog
2. typing `DELETE`

For online members, deletion removes the membership record but intentionally
does NOT delete the Supabase Authentication account. Removing Auth users from
a browser application would require privileged server/service-role access.

## Existing Supabase Database
Run once:
`supabase/08_MASTER_EDIT_DELETE_MEMBERS.sql`

Then deploy V6.10 to GitHub/Vercel.
