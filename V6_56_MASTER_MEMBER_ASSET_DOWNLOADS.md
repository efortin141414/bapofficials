# V6.56 — Master Member Asset Downloads

## Added in Master Access → Membership Database
- Member selection checkboxes and Select All.
- Download selector for Photo, QR Code, Signature, or All.
- Bulk download as a ZIP containing separate files/folders for each selected member.
- Individual download buttons inside each expanded member profile.

## File naming
All files use the issued BAP Membership ID Number:
- `BAP-NCR-2026-000001_PHOTO.jpg`
- `BAP-NCR-2026-000001_QR.png`
- `BAP-NCR-2026-000001_SIGNATURE.png`

Members without an issued Membership ID Number cannot be selected for asset downloads.
Missing photo/signature files are skipped during bulk export.
No SQL migration is required.
