# V6.33 — Public Website + Membership Portal

This release turns the existing membership application into a complete public
organization website while keeping all existing membership, Master Access,
digital ID, QR verification, certificate, poster, and database modules.

## New public website pages
- `/` — Website Home
- `/about` — About the Organization
- `/organization` — National & Regional Leadership
- `/membership-directory` — Public Membership Directory
- `/posters` — Published Commissioner & Director Posters
- `/membership` — Membership Information and Fees
- `/lookup` — Verify National ID
- `/contact` — Contact & Official Access

## Existing secure system retained
- Member registration / login
- Member application and drawn signature
- Payments
- Digital ID and certificate
- Master Access
- National Membership Database
- Excel ID-processing export
- ID Format Manager
- Certificate Generator
- Commissioner & Director Poster Manager
- Regional database and organizational chart

## Existing database installation
Run once after V6.32:

`supabase/15_PUBLIC_WEBSITE_POSTERS.sql`

This exposes only ACTIVE leadership posters through a safe public RPC. It does
not make the Master poster management table publicly editable.

## Deploy
Upload the extracted contents of V6.33 to the GitHub repository root, commit,
and redeploy the Vite project on Vercel.
