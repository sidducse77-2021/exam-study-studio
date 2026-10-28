export async function onRequestGet(context) {
  const clientId = context.env.GOOGLE_CLIENT_ID;
  const clientSecret = context.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = context.env.GOOGLE_REDIRECT_URI || `${new URL(context.request.url).origin}/api/drive-callback`;

  if (!clientId || !clientSecret) {
    return new Response(JSON.stringify({ error: "Google Drive OAuth is not configured. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI to Cloudflare Pages production secrets." }), {
      status: 503, headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/drive.readonly",
    access_type: "offline",
    prompt: "consent"
  });
  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, 302);
}
