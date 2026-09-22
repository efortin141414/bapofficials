# V6.13 — Strict Master-Only Membership Databases

## Access Model

### National Master Administrator
Can access:
- National Membership Database
- Regional Membership Database
- Member profile details
- Application forms
- Edit/Delete
- Regional CSV downloads
- Payment verification / activation
- Renew / Suspend
- ID / Certificate administrative views

### Regional Administrator
Cannot access individual member records.

Regional Admin sees only aggregate statistics for the assigned region:
- Total regional records
- Processing
- Active
- Paid

No names, emails, phone numbers, forms, IDs, certificates or regional CSV are
available to the Regional Admin.

### Member
Can access only the member's own:
- Membership application
- Application form
- Payment page
- Active National ID
- Membership certificate

A Member cannot open another member's record or any Master/Regional database.

## Existing Supabase Database

Run once:

`supabase/10_STRICT_MASTER_ONLY_DATABASE_ACCESS.sql`

This is important because V6.13 hardens both the website UI AND Supabase RLS.

Then deploy the V6.13 files to GitHub/Vercel.
