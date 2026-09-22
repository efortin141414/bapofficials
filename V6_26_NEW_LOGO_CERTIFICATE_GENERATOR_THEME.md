# V6.26 — New Logo + Master Certificate Generator + New Theme

## New official logo
The supplied BAP Technical Officials logo replaces the previous BAP logo throughout the application, including:
- Navigation/header
- Landing page
- Master Access
- Public profiles
- Membership certificate
- Blank forms and other screens that use the shared `BAP_LOGO` asset

The new logo is embedded in `embedded-assets.js` so deployment does not depend on a fragile external image path.

## Master-only Membership Certificate Generator
New tab in Master Access:
`Master Access → Certificate Generator`

Features:
- Search by name, Membership ID, Control Number, Chapter or Position
- Filter by Region
- Filter by membership status
- Select a member from the National Membership Database
- Preview the official Membership Certificate
- Open the protected print / Save PDF certificate page
- Open the selected member's public verification profile

The module is inside the existing National Admin security boundary and is visible only after `profiles.role = 'national_admin'` is verified.

## Application theme
The complete application receives a new executive BAP Technical Officials theme:
- Deep navy base
- Royal blue accent
- Philippine red accent
- Metallic gold highlights
- New premium header, hero, panels, buttons and Master Access styling
- Refreshed Membership Certificate styling to match the new logo

## SQL
No new Supabase SQL is required for V6.26.
