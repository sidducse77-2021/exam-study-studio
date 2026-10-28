One-time setup: Exam Study Studio + Gemini + Google Drive
1. Cloudflare Pages production secrets
Open Cloudflare Dashboard → Workers & Pages → your study-studio project → Settings → Variables and Secrets. Under Production, add these as Secrets (not plain text variables where possible):
GEMINI_API_KEY — your Gemini API key
GOOGLE_CLIENT_ID — OAuth 2.0 Web application client ID
GOOGLE_CLIENT_SECRET — OAuth client secret
GOOGLE_REFRESH_TOKEN — Google OAuth refresh token (instructions below)
GOOGLE_REDIRECT_URI — exact callback URL, recommended: https://exam-study-studio.pages.dev/api/drive-callback
Save changes and redeploy. Preview environment secrets are separate; configure them too only if you use preview deployments.
2. Google Cloud OAuth settings
In Google Cloud Console, select the project that owns your Web OAuth client. Enable Google Drive API. In the OAuth Web client, add this exact Authorized redirect URI:
https://exam-study-studio.pages.dev/api/drive-callback
The redirect URI must match GOOGLE_REDIRECT_URI exactly. If your real deployed site uses a different Pages domain, replace the domain in both places.
For a personal workspace, configure the OAuth consent screen and add your own Google account as a test user if the app is in Testing mode. The Drive scope in this version is read-only (drive.readonly) so the app can list and read files but cannot edit/delete Drive files.
3. Refresh token requirement
Click Connect Google Drive in the website after deploying. Google will ask you to authorize the app and return to /api/drive-callback. This starter deliberately does not show OAuth tokens in the browser and does not automatically write secrets into Cloudflare. To finish the setup, obtain the refresh token through a secure OAuth credential flow, then save it as the GOOGLE_REFRESH_TOKEN Cloudflare secret and redeploy. Never paste tokens into GitHub, chat, frontend code, or screenshots.
If Google does not issue a refresh token, remove this app's access from your Google Account security settings and reconnect with consent. Do not publish the token.
4. What currently works
Gemini MCQ generation through /api/generate using GEMINI_API_KEY.
Gemini image OCR for PNG/JPG/JPEG/WEBP/GIF images up to 7 MB.
Text-based PDF extraction in the browser using PDF.js.
Google Drive listing and importing plain text files and Google Docs once OAuth secrets are valid.
Google Drive PDFs are listed, but this importer does not OCR the PDF bytes; download the PDF and upload it in Documents & News Analysis. Scanned PDF OCR is not automatically performed page-by-page yet.
5. Important limitations
Browser study data still lives in localStorage. It does not sync between browsers/devices. True multi-device sync needs a database and user authentication.
The OAuth callback cannot securely save its newly issued refresh token into Cloudflare Secrets by itself; this is a manual one-time configuration step.
Gemini retry handling helps transient errors but cannot bypass API quotas or rate limits.
AI output is a study aid, not an official answer key. Verify facts against official sources.
