# V6.54 — Membership Directory: Region + Chapter Subsections

## Changes
- Public Membership Directory is now organized first by **Region**, then by **Chapter**.
- Each Region has its own official section with an active-member count.
- Each Region contains separate Chapter subsections with Chapter-level member counts.
- Added a Region index/navigation block at the top for quick access.
- Added a Chapter filter next to the existing Region filter.
- Existing member cards, QR codes, profile links, Membership ID, Control Number, and privacy behavior are preserved.
- Directory fetch limit increased from 200 to 500 records for the grouped view.

## SQL
No SQL migration is required. This update uses the Region and Chapter values already returned by the existing public directory RPC.
