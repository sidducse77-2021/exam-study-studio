Exam Study Studio
Bilingual (English + Telugu) study workspace for UPSC, APPSC, RRB, SSC, CTET, DSC and TET.
Included
Master MCQ collection, filters, sets, print/export and revision
Document workspace for PDF/TXT/MD/DOCX and image uploads
Gemini MCQ generation via Cloudflare Pages Function
Gemini OCR endpoint for supported image formats
Terms Explorer, notes, alerts, study planner and local backup
Google Drive listing/import routes (requires one-time OAuth configuration)
Retry handling and clearer API errors for transient Gemini failures
Deploy
Push the repository to GitHub and connect it to Cloudflare Pages.
Set the build output directory to the repository root (no build command is needed for the static app).
Add GEMINI_API_KEY as a Cloudflare Pages Production Secret.
Redeploy and test the Documents workspace with a small text-based PDF.
For Drive, follow GOOGLE_DRIVE_SETUP.md and add the required OAuth secrets/redirect URI.
Current limitations
Browser records are stored in localStorage; they do not automatically sync between devices.
Google Drive integration remains unavailable until OAuth credentials and refresh token are correctly configured.
Drive PDF import opens the file for manual download/upload; it does not yet run automatic page-by-page OCR on Drive PDFs.
Image OCR accepts PNG/JPG/JPEG/WEBP/GIF up to 7 MB.
Rate-limit retries cannot bypass Gemini project quota limits.
AI-generated material should be verified against official sources.
Local preview
Run python -m http.server 8000 from the repository root, then open http://localhost:8000.
