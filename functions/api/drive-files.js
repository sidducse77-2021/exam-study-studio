async function getAccessToken(context) {
  const { GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: clientSecret, GOOGLE_REFRESH_TOKEN: refreshToken } = context.env;
  if (!clientId || !clientSecret || !refreshToken) return { error: "Google Drive is not configured. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN and GOOGLE_REDIRECT_URI as Cloudflare Pages production secrets." };

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) return { error: payload.error_description || payload.error || "Could not refresh the Google Drive access token." };
  return { accessToken: payload.access_token };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const fileId = url.searchParams.get("fileId");
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = context.env;
    if (!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REFRESH_TOKEN)) return json({ configured: false, files: [] });

    const tokenResult = await getAccessToken(context);
    if (!tokenResult.accessToken) return json({ configured: true, files: [], error: tokenResult.error }, 502);
    const headers = { Authorization: `Bearer ${tokenResult.accessToken}` };

    if (!fileId) {
      const params = new URLSearchParams({
        q: "trashed = false and mimeType != 'application/vnd.google-apps.folder'",
        fields: "files(id,name,mimeType,webViewLink,size,modifiedTime)",
        pageSize: "50",
        orderBy: "modifiedTime desc"
      });
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, { headers });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) return json({ configured: true, files: [], error: payload.error?.message || "Could not list Google Drive files." }, response.status);
      return json({ configured: true, files: Array.isArray(payload.files) ? payload.files : [] });
    }

    const metaResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,webViewLink,size`, { headers });
    const metadata = await metaResponse.json().catch(() => ({}));
    if (!metaResponse.ok) return json({ error: metadata.error?.message || "Could not read Drive file metadata." }, metaResponse.status);
    if (Number(metadata.size || 0) > 15 * 1024 * 1024) return json({ error: "This Drive file is over 15 MB. Download it and upload a smaller section instead." }, 413);

    if (metadata.mimeType === "application/vnd.google-apps.document") {
      const exportResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text/plain`, { headers });
      if (!exportResponse.ok) return json({ error: "Could not export this Google document as text." }, exportResponse.status);
      return json({ configured: true, id: fileId, name: metadata.name, mimeType: metadata.mimeType, text: await exportResponse.text() });
    }
    if (metadata.mimeType?.startsWith("text/")) {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, { headers });
      if (!response.ok) return json({ error: "Could not download the selected text file." }, response.status);
      return json({ configured: true, id: fileId, name: metadata.name, mimeType: metadata.mimeType, text: await response.text() });
    }
    if (metadata.mimeType === "application/pdf") {
      return json({ configured: true, id: fileId, name: metadata.name, mimeType: metadata.mimeType, text: "", message: "This is a PDF. Download it from Google Drive and upload it in the Documents workspace so PDF.js or OCR can process it.", webViewLink: metadata.webViewLink });
    }
    return json({ configured: true, id: fileId, name: metadata.name, mimeType: metadata.mimeType, text: "", message: "This file type cannot be converted to text by the Drive importer. Download it and upload it in the Documents workspace." });
  } catch (error) {
    console.error("Drive files API error", error);
    return json({ error: "Google Drive request failed. Check OAuth settings and try again." }, 500);
  }
}
