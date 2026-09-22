# V6.9 — Direct Processing + Application Form + Regional Database

## New Member Application Workflow

1. Member completes the National Membership Application.
2. Photo and signature are required.
3. Member submits the completed form.
4. The system automatically generates a unique Form Code:
   `BAP-FORM-YYYY-000001`
5. The application status becomes `PROCESSING`.
6. The member can immediately:
   - View the official application form
   - Download the form as HTML
   - Print / Save the form as PDF
   - Proceed to payment
7. There is NO separate application approval.
8. After an administrator verifies payment, `Confirm Payment & Activate`:
   - marks payment verified
   - automatically issues the Membership ID Number
   - automatically issues the Control Number
   - activates the two-year membership

## Master Access Regional Database

New Master-only tab:

`Regional Database`

The Master Administrator can:
- select any region
- see all members assigned to that region
- see region totals, active, processing and payment-pending counts
- download that region's complete membership database as CSV

CSV includes:
- Form Code
- Membership ID
- Control Number
- Full Name
- Position
- Region
- Chapter
- Mobile
- Email
- Status
- Payment Status
- Submission date
- Issue date
- Valid-until date

## Existing Supabase Database

Run once:

`supabase/07_DIRECT_PROCESS_FORM_CODE_REGIONAL_DATABASE.sql`

Then deploy V6.9 to GitHub/Vercel.
