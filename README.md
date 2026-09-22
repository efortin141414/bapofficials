# BAP National Membership System — FRESH V6

Clean START FROM ZERO build.

New in V4:
- Master Access Membership Database
- Master can create membership profiles manually
- Manual profiles do not require an Auth/login account
- Positions are selected from the Master-managed Positions Database
- Optional immediate approval/control-number issuance
- Expandable member profile details in Master Access

Fresh database:
1. Create a brand-new Supabase project.
2. Run `supabase/01_FRESH_SUPABASE_SETUP.sql` once.
3. Deploy to GitHub/Vercel.
4. Connect using the first-run setup screen.
5. Create Master Auth user.
6. Run `supabase/02_PROMOTE_MASTER.sql`.
7. Login at `/master-login`.

See `FRESH_V4_MASTER_MEMBERSHIP_DATABASE.md`.


New in V5: National Master Administrator can view ID and certificate previews for every membership record, including pending records. Official printing remains available for active memberships.


New in V6: every approved member gets a unique Membership ID Number plus a unique QR code on the ID and certificate.


## Latest Update

- **V6.43** — Public Profile QR now matches the Digital ID QR destination exactly.


## Latest Update

- **V6.44** — Digital ID name made bolder and back-side information aligned better with the printed details.


## V6.49

Existing legacy QR links now redirect directly to the public member profile. No SQL migration is required.


## Latest Update
- **V6.50** — Stable QR domain selection using `VITE_PUBLIC_SITE_URL`, with fallback to the permanent Vercel project domain.


## Latest Update

- **V6.51** — Forces all newly rendered member QR codes to the stable production Vercel domain and ignores old parked-domain QR configuration.


## Latest Update
- **V6.54** — Membership Directory grouped into Region sections with Chapter subsections and a Chapter filter.


## Latest Update

- **V6.55** — Membership Directory grouped by Region and Chapter with standardized 2x2-style member photos; search, filters, region navigation, QR, and profile buttons retained.


## V6.56 — Master Member Asset Downloads
Master Access can select member profiles and download Photo, QR, Signature, or all three. Files are named by BAP Membership ID Number.
