# V6.55 — Directory Region / Chapter Sections + 2x2 Member Photo

This release applies the requested public Membership Directory specification.

## Included

- Directory remains grouped by **Region**.
- Each Region remains divided into **Chapter** subsections.
- Member photos are now shown in a standardized **2x2-style square / passport-photo layout**.
- Name / Membership ID / Control Number search continues to work.
- Chapter filter remains available.
- Region quick-navigation remains available.
- Member cards keep the QR code and **View Official Profile** button.
- Existing original Vercel QR destination from V6.53 remains unchanged.

## Photo display

- Square 1:1 presentation.
- 140 x 140 px on desktop, 124 x 124 px on smaller screens.
- `object-fit: cover` with top-centered framing for a passport-photo appearance.
- Formal dark-blue border and white photo frame.

## SQL

No SQL migration is required. This is a frontend directory-layout update only.
