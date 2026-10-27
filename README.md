# Exam Study Studio — Fresh Project

A mobile-friendly, local-first competitive examination study website starter.

## Features
- Central MCQ library with previous/next navigation and 15-question set filtering
- Add questions with English/Telugu explanations and additional information
- Export master MCQs as JSON or CSV
- Print / Save as PDF using the browser print dialog
- Text-based PDF text extraction with PDF.js (no OCR)
- Local document library, notes, terms, manual exam alerts, and study planner
- JSON backup and restore
- Responsive layout and PWA starter files

## Important limitations
- No AI API, OCR, paid database, or automatic live-news crawling is included.
- The built-in sample questions are starter examples, not a complete syllabus or official PYQ bank.
- Questions created from uploaded text use a simple template and must be reviewed; this is not AI reasoning.
- Scanned/image-only PDFs require OCR, which this project intentionally does not include.
- Google Drive sync is not configured. Use Download full backup, upload the JSON to Drive manually, then restore it on another device.
- LocalStorage data is specific to that browser/device and can be cleared. Back up regularly.
- PDF.js is loaded from a CDN, so first-time PDF extraction requires internet access.

## Run locally
Open `index.html` in a browser. For service worker/PWA behavior, serve the folder through a static web server (not `file://`).

## Deploy
1. Create a new GitHub repository.
2. Upload all project files to the repository root.
3. In Cloudflare Pages, create a project connected to that repository.
4. Use the static site deployment defaults; no build command is required, and the output directory is `/`.
5. Open the deployed URL on mobile and desktop.

## Backups
Use Backup & Settings → Download full backup. Keep a copy in Google Drive or another safe location. Restore by selecting the JSON backup file.

## Next development phase
For real generative AI explanations, live web research, automatic exam monitoring, secure user login, and automatic Google Drive synchronization, add properly configured server-side services and OAuth. Never place secrets in `app.js`.
