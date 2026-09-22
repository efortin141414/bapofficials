# V6.22 — National Membership Database QR Export

## New update
The **National Membership Database Excel export** now includes each member's **individual profile QR code**.

## What was added
1. **ID Processing Excel export**
   - Added **PROFILE QR** column with embedded QR image
   - Added **Profile QR URL** column
   - Keeps the existing embedded **PHOTO** and **SIGNATURE** columns

2. **Purpose**
   - When the Master Admin downloads the **ID Processing Excel**, the QR code needed for the member ID is already included.
   - This makes the export ready for **ID printing and processing**.

## Important
- The QR code directs to the member's public membership profile.
- The ID card preview and printing page already continue to use the same QR.
- **No new SQL is required** for this update.

## Deploy
1. Upload this V6.22 package to GitHub
2. Commit and push
3. Let Vercel redeploy
