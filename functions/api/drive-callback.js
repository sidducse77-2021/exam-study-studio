export async function onRequestGet(context) {
  const requestUrl = new URL(context.request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");

  if (error) {
    return new Response(`Google OAuth failed: ${error}`, {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  if (!code) {
    return new Response("Missing OAuth code.", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  const clientId = context.env.GOOGLE_CLIENT_ID;
  const clientSecret = context.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = context.env.GOOGLE_REDIRECT_URI || "http://localhost:8000/drive/oauth/callback";

  if (!clientId || !clientSecret) {
    return new Response("Google Drive OAuth is not configured on this deployment.", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });

  const tokenPayload = await tokenResponse.json().catch(() => ({}));

  if (!tokenResponse.ok) {
    return new Response(`OAuth token exchange failed: ${tokenPayload.error || "invalid_token"}`, {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  const accessToken = tokenPayload.access_token;
  const refreshToken = tokenPayload.refresh_token || "";

  const responseHtml = `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Drive OAuth complete</title>
      </head>
      <body style="font-family:system-ui,sans-serif;padding:32px;">
        <h2>Google Drive OAuth completed</h2>
        <p>Token exchange succeeded. Store access and refresh tokens securely server-side if you are enabling persistence.</p>
        <p><strong>Access token:</strong> ${accessToken ? "present" : "missing"}</p>
        <p><strong>Refresh token:</strong> ${refreshToken ? "present" : "not returned"}</p>
        <p>This project remains local-first and requires valid server-side configuration before any file import is considered active.</p>
      </body>
    </html>
  `;

  return new Response(responseHtml, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8"
    }
  });
}
