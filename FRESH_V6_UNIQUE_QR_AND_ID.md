# BAP Membership System — FRESH V6

## New Feature
Every approved National Membership ID now has:

- a unique QR code
- a unique Membership ID Number
- a separate Control Number

### Unique Membership ID Number
Generated automatically on approval:

`BAP-MID-YYYY-000001`

### Control Number
Still generated automatically on approval:

`BAP-NTO-REGION-YYYY-000001`

### QR Code
The QR code is generated for every ID and certificate and points to the official verification page.

Example:
`/verify/{control_number}?uid={member_id_number}`

This keeps the QR code unique per member while remaining easy to scan and verify.

## Database
For a brand-new installation, run:
`supabase/01_FRESH_SUPABASE_SETUP.sql`

This schema includes:
- `member_id_number`
- `member_control_seq`
- `member_id_seq`

The Master Admin can also view the unique ID number inside Master Access → Membership Database.
