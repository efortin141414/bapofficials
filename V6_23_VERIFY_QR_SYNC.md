# V6.23 — Verify ID QR Synchronization

## Update added
The **Verify ID / Scan QR** module is now synchronized with the same QR used in:
- Membership ID
- Membership Directory
- National Membership Database Excel export

## What changed
- If the scanned QR contains a **/profile/** link, the scanner now opens that member's **public profile** directly.
- If the scanned QR contains a **/verify/** link, it still works.
- If the user manually enters a member number or control number, the system opens the synchronized profile page.

## Result
The same QR code used for ID printing and the national database will now work when scanned from the **Verify ID** page.

## SQL
No SQL required.
