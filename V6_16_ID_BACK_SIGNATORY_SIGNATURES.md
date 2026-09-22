# V6.16 — Signatory Signatures on Back of National ID

The back of the National Membership ID now automatically overlays the uploaded
signature images above the three printed signature lines:

1. National Commissioner
2. National President
3. Vice President

The existing back artwork and emergency-contact area are preserved.

## Master Access

Run the SQL migration first. Then open:

Master Access → Signatories & Regions

The National Commissioner, National President and Vice President records will
be available. Upload each authorized signature image there.

The ID back automatically uses the current uploaded `signature_url` for each
signatory whenever the ID is viewed or printed.

If a signature has not been uploaded, that signature area remains blank.

## Existing Supabase Project

Run once:

`supabase/11_ID_BACK_SIGNATORY_SIGNATURES.sql`

Then deploy V6.16 to GitHub/Vercel.
