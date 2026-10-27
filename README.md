# Exam Study Studio

A bilingual, mobile-first exam preparation workspace for UPSC, APPSC, SSC, RRB, CTET, DSC, TET and related competitive exams.

## Features included in this upgrade

- Bilingual English + Telugu support across study flows
- Central MCQ library with filtering, set navigation and exports
- Document upload support for PDF, TXT, MD, DOCX and image files where feasible
- AI-powered MCQ generation using the Cloudflare Pages backend and Gemini API
- Safe API handling with validation, retries, quota awareness and clear error messages
- Study dashboard with progress, countdowns and task planning
- Terms explorer, notes, exam alerts and data backup
- Google Drive workflow that remains disabled until secure OAuth config is complete
- Clear labeling of cloud sync and Drive workflows as gated until credentials are configured

## Important limitations

- Google Drive OAuth is not active until the Google Cloud credentials and redirect URIs are configured.
- Cloud persistence is not active unless a tested real database and auth flow are set up.
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

1. Push this repo to GitHub.
2. In Cloudflare Pages, create a project connected to the repo.
3. Keep the project root as the deployment root.
4. Add the following env vars:
   - `GEMINI_API_KEY`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REFRESH_TOKEN`
   - `GOOGLE_REDIRECT_URI`
5. Deploy and confirm `/api/generate` responds with valid JSON.
6. Verify the Drive routes and the OAuth callback configuration before enabling real import workflows.

## Google Drive setup

See `GOOGLE_DRIVE_SETUP.md` for the exact Google Cloud configuration steps.

## Backup and safety

- Download full backup from Backup & Settings.
- Keep a copy in a safe location before major changes.
- Local data is preserved in browser storage and can be restored using the JSON backup.
- Google Drive imports are only operational after server-side credentials are properly configured.

## Available validation

Run:

`npm run check`

This validates the basic JavaScript syntax for the app and the Cloudflare Functions handlers.
