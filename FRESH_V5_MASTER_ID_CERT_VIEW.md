# BAP Membership System — FRESH V5

## New Master Access: View ID & Certificate

The National Master Administrator can now view the ID and Membership Certificate of every member record from:

`/master-access` → `Membership Database`

Actions:
- View ID
- View Certificate

### Active Members
For active members, Master Access can:
- View the official ID
- Print / Save ID as PDF
- View the official certificate
- Print / Save certificate as PDF

### Pending / Rejected / Suspended Records
The Master Administrator can still open the ID and certificate for review.

These records are shown as:
`MASTER ADMIN PREVIEW • NOT YET AN ACTIVE MEMBERSHIP`

Official printing is disabled until the membership is active.

### Back Navigation
The ID and Certificate screens include a:
`Back to Master Access`
button for the National Master Administrator.

## Database
No new database table or SQL migration is required beyond the Fresh V4/V5 schema.
For a brand-new installation, run:
`supabase/01_FRESH_SUPABASE_SETUP.sql`
once.
