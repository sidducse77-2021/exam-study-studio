export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const oauthError = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  if (oauthError) return new Response(`Google OAuth was cancelled or failed: ${oauthError}`, { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  if (!code) return new Response("Missing Google OAuth authorization code.", { status: 400 });

  const { GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: clientSecret } = context.env;
  const redirectUri = context.env.GOOGLE_REDIRECT_URI || `${url.origin}/api/drive-callback`;
  if (!clientId || !clientSecret) return new Response("Google OAuth is not configured in Cloudflare Pages.", { status: 503 });

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" })
  });
  const tokenPayload = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !tokenPayload.refresh_token) {
    const message = tokenPayload.error_description || tokenPayload.error || "Google did not return a refresh token. Remove the app access from your Google Account and reconnect.";
    return new Response(`Google Drive connection was not completed: ${message}. No tokens have been displayed or stored by this page.`, { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  // Never print OAuth tokens into the browser. Store the refresh token as a Cloudflare secret manually.
  return new Response(`Google authorization succeeded. IMPORTANT: this starter cannot securely write a newly issued refresh token into Cloudflare environment secrets automatically. For secure import, add the refresh token as GOOGLE_REFRESH_TOKEN in Cloudflare Pages > Settings > Variables and Secrets, then redeploy. This page intentionally does not display the token.`, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
  });
}
