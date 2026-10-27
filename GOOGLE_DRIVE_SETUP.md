# Google Drive configuration guide

This project includes a Google Drive workflow UI, but the connection is disabled until the required provider configuration is complete and tested.

## Required setup

1. Create a Google Cloud project.
2. Enable the Google Drive API.
3. Create OAuth 2.0 credentials for a web application.
4. Add redirect URIs such as:
   - `https://<your-pages-project>.pages.dev/drive/oauth/callback`
   - `http://localhost:8000/drive/oauth/callback`
5. Add the OAuth client ID and client secret to secure server-side environment variables.
6. Configure the OAuth consent screen and minimum required scopes.
7. Test the Drive file import flow before enabling production use.

## Minimum permission scope

Use the least-privilege scope required for the workflow, typically:
- `https://www.googleapis.com/auth/drive.file`

Avoid broad Drive access unless it is absolutely necessary.

## Required Cloudflare Pages environment variables

Add the following to Cloudflare Pages:
- `GEMINI_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `GOOGLE_REDIRECT_URI`

The redirect URI should match the exact callback endpoint used by your deployment.

## Important restrictions

- Do not place Google OAuth client IDs or secrets in frontend JavaScript.
- Do not claim Drive sync is active unless the OAuth flow and file import were tested.
- Do not claim AI-generated content is verified or official.
- Keep all secrets in secure server-side environment variables.

## Local implementation note

This repository intentionally keeps the Google Drive workflow visible but clearly gated until the real provider configuration is complete.
