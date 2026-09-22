# V6.19 — National Membership Database Excel Export for ID Processing

New Master-only button:

`Master Access → Membership Database → Download ID Processing Excel`

The export creates a real `.xlsx` workbook in the browser.

## ID Processing worksheet
Includes:
- Form Code
- Membership ID
- Control Number
- Full Name
- Position
- Designation
- Region Code
- Region Name
- Chapter
- Mobile Number
- Email Address
- Membership Status
- Payment Status
- Membership Fee
- Accreditation Fee
- Total Fees
- Application Submitted
- Date Issued
- Valid Until
- Renewal Count
- Last Renewed
- Record Source
- Emergency Contact Name
- Relationship
- Emergency Mobile
- Emergency Email
- Embedded Member Photo
- Embedded Member Signature
- Photo URL
- Signature URL
- Created At
- Updated At

Member photos and signatures are fetched from their existing public Supabase
Storage URLs and embedded directly inside the Excel workbook.

If an image cannot be fetched, the image URL is still included in the Excel
record so the Master Administrator can retrieve it manually.

## Summary worksheet
Includes national counts and by-region counts:
- Total
- Processing
- Pending
- Active
- Payment Pending
- Embedded photos/signatures
- Missing photo/signature counts

## Security
The export control exists only inside National Master Access.
Regional Admin and Member accounts do not receive this database export.

## Installation
No new Supabase SQL migration is required.

V6.19 adds the browser dependency:
`exceljs@4.4.0` (browser bundle)

After replacing the GitHub files, Vercel will install the dependency during the
normal `npm install` build.
