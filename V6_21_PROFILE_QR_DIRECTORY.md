# V6.21 — Individual Profile QR Code

## New update
Every public membership profile now has its own individual QR code.

## What was added
1. **Membership Directory cards**
   - Each member card now shows a QR code.
   - Scanning the QR opens that member's public verification profile directly.

2. **Individual Public Profile page**
   - Each public profile page now also shows its own QR code.
   - This makes it easy to share or print the member's direct profile QR.

## Technical behavior
The QR code points to:
`/profile/{member_id_number}`

If a member does not yet have a member ID number, it falls back to the control number.

## Deploy
No new SQL is required for this update.

Just:
1. Replace the files in GitHub with V6.21
2. Commit and push
3. Let Vercel redeploy
