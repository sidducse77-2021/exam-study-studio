export async function onRequestGet(context) {
  const clientId = context.env.GOOGLE_CLIENT_ID;
  const redirectUri = context.env.GOOGLE_REDIRECT_URI || "http://localhost:8000/drive/oauth/callback";

  if (!clientId || !context.env.GOOGLE_CLIENT_SECRET) {
    return new Response(JSON.stringify({
      error: "Google Drive OAuth is not configured for this deployment."
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      }
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/drive.file",
    access_type: "offline",
    prompt: "consent"
  });

  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
