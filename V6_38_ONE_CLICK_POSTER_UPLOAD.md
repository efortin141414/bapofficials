# V6.38 — One-Click Poster Upload

The Commissioner & Director Poster Manager is simplified.

## Master Access workflow

Go to:

`Master Access → Commissioner & Director Posters`

Now the administrator only needs to:

1. Select the finished poster image.
2. Click **Upload & Post Automatically**.

No other fields are required.

Removed from the upload form:
- Poster type
- Full name
- Position
- Region
- City / Province / Municipality
- Caption
- Display order
- Active checkbox

The poster is automatically:
- uploaded to Supabase Storage
- saved to the poster database
- set to ACTIVE
- published to the public `/posters` page

## Public poster gallery

The public Posters page now displays the poster artwork itself without an extra
name/title/caption card below it, because the uploaded poster image already
contains the official text and design.

## Database compatibility

No new SQL migration is required.

The existing leadership_posters table still stores internal default values so
this remains compatible with V6.32/V6.33 database structure.
