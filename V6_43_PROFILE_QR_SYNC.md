# V6.43 — Profile QR = ID QR Sync

The member QR shown on the **Public Profile** now uses the **same shared QR generator** and the **same official QR destination** as the QR code shown on the **Digital ID**.

## What changed

- The **Digital ID QR** and **Profile QR** now both use the same shared React component.
- Both QR codes point to the same official public member profile URL.
- The profile page now clearly states that the QR is the same QR used on the member ID.
- The lookup page now states that you can scan the QR from either the **ID** or the **Profile**.

## Result

Scanning the QR from the member **ID** or from the member **Profile** will open the **same official member profile**.

## SQL needed?

No additional SQL is required for this update. This is a frontend QR synchronization fix.
