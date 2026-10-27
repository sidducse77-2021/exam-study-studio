async function getAccessToken(context) {
  const clientId = context.env.GOOGLE_CLIENT_ID;
  const clientSecret = context.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = context.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  });

  const tokenPayload = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok) {
    return null;
  }

  return tokenPayload.access_token || null;
}

async function fetchDriveFiles(context, accessToken) {
  const response = await fetch("https://www.googleapis.com/drive/v3/files?q=mimeType!='application/vnd.google-apps.folder'&fields=files(id,name,mimeType,webViewLink)&pageSize=20", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    return [];
  }

  const payload = await response.json().catch(() => ({ files: [] }));
  return Array.isArray(payload.files) ? payload.files : [];
}

async function fetchDriveFileText(context, accessToken, fileId) {
  const metadataResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!metadataResponse.ok) {
    return null;
  }

  const metadata = await metadataResponse.json().catch(() => ({}));
  const mimeType = String(metadata.mimeType || "");

  if (!mimeType || mimeType.includes("google-apps")) {
    return null;
  }

  const exportUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`;
  const fileResponse = await fetch(exportUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!fileResponse.ok) {
    return null;
  }

  const contentType = fileResponse.headers.get("content-type") || "";
  const bytes = await fileResponse.arrayBuffer();
  const textDecoder = new TextDecoder("utf-8");
  const text = textDecoder.decode(bytes);

  if (contentType.includes("application/pdf")) {
    return text || "";
  }

  if (contentType.includes("text/")) {
    return text || "";
  }

  return text || "";
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const fileId = url.searchParams.get("fileId");
  const configured = !!(context.env.GOOGLE_CLIENT_ID && context.env.GOOGLE_CLIENT_SECRET && context.env.GOOGLE_REFRESH_TOKEN);

  if (!configured) {
    return new Response(JSON.stringify({ configured: false, files: [] }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      }
    });
  }

  const accessToken = await getAccessToken(context);
  if (!accessToken) {
    return new Response(JSON.stringify({ configured: true, files: [], error: "Could not obtain Google Drive access token." }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      }
    });
  }

  if (fileId) {
    const text = await fetchDriveFileText(context, accessToken, fileId);
    const metadataResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const metadata = await metadataResponse.json().catch(() => ({}));
    return new Response(JSON.stringify({
      configured: true,
      id: fileId,
      name: metadata.name || "Imported Drive file",
      mimeType: metadata.mimeType || "",
      text: text || ""
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      }
    });
  }

  const files = await fetchDriveFiles(context, accessToken);
  return new Response(JSON.stringify({
    configured: true,
    files
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}
