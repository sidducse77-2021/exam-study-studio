# Google Drive configuration guide

This project includes a Google Drive workflow UI, but the actual connection is disabled until required provider configuration is complete.

## Required setup

1. Create a Google Cloud project.
2. Enable the Google Drive API.
3. Create OAuth 2.0 credentials for a web app.
4. Add redirect URIs such as:
   - `https://<your-pages-project>.pages.dev/drive/oauth/callback`
   - `http://localhost:8000/drive/oauth/callback`
5. Add the OAuth client ID and secret to a secure server-side environment.
6. Configure the OAuth consent screen and minimum required scopes.
7. Test the Drive file access flow before enabling production use.

## Minimum permission scope

Use the least-privilege scope required for the workflow, typically:
- `https://www.googleapis.com/auth/drive.file`

Avoid requesting broad Drive access unless absolutely necessary.

## Important restrictions

- Do not place Google OAuth client IDs or secrets in browser source code.
- Do not claim Drive sync is active unless the OAuth flow and file import are tested.
- Keep all secrets in secure server-side environment variables.

## Local implementation note

This repository intentionally keeps the Google Drive workflow visible but clearly gated until the real provider configuration is complete.
