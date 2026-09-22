# V6.18 — Fix Blank Form Download / Open / Print

V6.17 used a public URL:
`/downloads/BAP_Blank_Membership_Form.pdf`

If that static file was not deployed or served correctly, the buttons did not
work.

V6.18 embeds the PDF bytes directly inside the website build through:
`blank-form-pdf.js`

The blank-form module now uses JavaScript buttons:

- Download Blank Form PDF
  - creates a PDF Blob from the embedded PDF and downloads it.

- Open PDF
  - creates a PDF Blob and opens it in a new browser tab.

- Print Blank Form
  - opens the actual HTML blank form in a dedicated print window and launches
    the browser print dialog in A4 portrait format.

The original static PDF remains in:
`public/downloads/BAP_Blank_Membership_Form.pdf`
as a fallback, but the buttons do not depend on that URL anymore.

No Supabase SQL migration is required.
