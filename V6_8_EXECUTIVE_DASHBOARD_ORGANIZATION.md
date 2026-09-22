# V6.8 — Public Executive Dashboard + Organizational Chart

## Public Executive Dashboard
Available to every website visitor at:

`/executive-dashboard`

The landing page also shows a compact live executive snapshot.

Metrics:
- Total Members
- Active Members
- New Members — first issuance in last 30 days
- Renewed Members — members with at least one recorded renewal
- Renewal Due — active memberships expiring in next 60 days
- Inactive Members

The full dashboard also shows membership statistics for every region.

## Public Organizational Chart
Available at:

`/organization`

It displays:
- National Leadership
- Leadership by selected region
- Regional Leadership
- Provincial Leadership
- Local Leadership
- All-region index

Only active official members assigned to positions whose category contains
`Leadership` are published.

Private information is NOT exposed:
- phone
- email
- emergency contacts
- member signature

## Existing Supabase Project
Run once:

`supabase/06_EXECUTIVE_DASHBOARD_ORGANIZATION.sql`

Then deploy the V6.8 website files to GitHub/Vercel.

## Renewal Tracking
V6.8 adds:
- `renewal_count`
- `last_renewed_at`

Renewals completed before installing V6.8 cannot be reconstructed automatically
unless you manually backfill them. Renewals processed after V6.8 are counted
automatically.
