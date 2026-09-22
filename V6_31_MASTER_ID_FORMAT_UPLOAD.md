# V6.31 — Master ID Format Upload

New Master-only module:

`Master Access → ID Format Manager`

The National Master Administrator can now upload / replace:
- Front National Membership ID format
- Back National Membership ID format

The uploaded artwork is saved in Supabase Storage and the active template URLs
are stored in `public.id_templates`.

Digital ID views automatically use the active format in:
- Master ID preview / print
- Member dashboard ID
- Public QR profile
- Verify ID view

The uploaded 2026-style layout automatically fits:
- Member photo
- Full name
- Designation
- Region
- Chapter / City
- Membership ID
- Date issued
- Valid until
- Member signature
- Dynamic QR code
- Emergency contact information
- National Commissioner / National President / National Vice President signatures

Existing Supabase project:
Run `supabase/13_ID_FORMAT_TEMPLATE_MANAGER.sql` once before using the module.

Fresh project:
The latest `01_FRESH_SUPABASE_SETUP.sql` already includes the ID template table
and policies.
