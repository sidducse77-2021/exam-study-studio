# Exam Study Studio

A bilingual, mobile-first exam preparation workspace for UPSC, APPSC, SSC, RRB, CTET, DSC, TET and related competitive exams.

## Features included in this upgrade

- Bilingual English + Telugu support across study flows
- Central MCQ library with filtering, set navigation and exports
- Document upload support for PDF, TXT, MD, DOCX and image files where feasible
- AI-powered MCQ generation using the existing Cloudflare Pages backend and Gemini API
- Safe API handling with validation, retries, quota awareness and error messages
- Study dashboard with progress, countdowns and task planning
- Terms explorer, notes, exam alerts and data backup
- Clear labeling of Google Drive and cloud sync as not yet connected unless configured

## Important limitations

- Google Drive OAuth is not active until you configure Google Cloud credentials and redirect URIs.
- Cloud persistence is not active until a real database and auth provider are configured and tested.
- Image OCR and multimodal processing require a configured backend or library.
- Live news crawling is not implemented and is not claimed as working.
- AI-generated content must still be checked for factual accuracy and official verification.

## Local development

1. Open the repo root in a static web server.
2. Example:
   `python -m http.server 8000`
3. Visit:
   `http://localhost:8000`

## Cloudflare Pages deployment

1. Push this project to GitHub.
2. In Cloudflare Pages, create a project connected to the repo.
3. Keep the project root as the deployment root (no build step needed unless you add one).
4. Add environment variable:
   `GEMINI_API_KEY`
5. Deploy and open the site.
6. Verify that `/api/generate` works and returns valid JSON.

## Google Drive setup

See `GOOGLE_DRIVE_SETUP.md` for the exact Google Cloud configuration steps.

## Backup and safety

- Download full backup from Backup & Settings.
- Keep a copy in a safe location before major changes.
- Local data is preserved in browser storage and can be restored using the JSON backup.

## Available validation

Run:

`npm run check`

This validates the basic JavaScript syntax for the app and the Cloudflare Functions handler.
