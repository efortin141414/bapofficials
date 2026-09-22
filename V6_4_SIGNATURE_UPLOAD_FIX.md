# V6.4 — Signatory Signature Upload Fix

This fixes National and Regional signature uploads in Master Access.

Changes:
- Admin uploads now use `{auth.uid()}/admin/...` in Supabase Storage.
- This works with both current and older user-folder Storage policies.
- Signatory database updates are verified with `.select().single()`.
- Clear success/error messages are shown.
- Current saved signature is previewed in Master Access.
- PNG, JPG/JPEG and WebP are supported.
- HEIC is rejected because browser rendering is unreliable.
- Maximum upload size is 5 MB.

## Existing Supabase project

Run this once:

`supabase/05_FIX_SIGNATURE_UPLOAD.sql`

Then deploy the V6.4 application files to GitHub/Vercel.

After deployment:
Master Access → Signatories & Regions → choose signature → Save Signature.

You should receive a success message and see the saved signature preview.
