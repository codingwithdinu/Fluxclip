import http from "node:http";
import { URL } from "node:url";

const PORT = Number(process.env.PORT || 8080);
const MAX_BYTES = Number(process.env.MAX_DOWNLOAD_BYTES || 524288000);
const ALLOWED_HOSTS = new Set(
  (process.env.ALLOWED_MEDIA_HOSTS || "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean),
);
const TOKEN = process.env.WORKER_API_TOKEN || "";

function json(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  res.end(JSON.stringify(payload));
}

function safeFilename(value) {
  const name = String(value || "media-download")
    .replace(/[\\/:*?"<>|\r\n\u0000-\u001f]/g, "-")
    .replace(/^\.+/, "")
    .trim()
    .slice(0, 140);
  return name || "media-download";
}

function validateSource(raw) {
  let url;
  try { url = new URL(raw); } catch { throw new Error("Provide a valid direct media URL."); }
  if (url.protocol !== "https:") throw new Error("Only HTTPS media URLs are accepted.");
  if (url.username || url.password) throw new Error("URLs containing credentials are not accepted.");
  if (url.port && url.port !== "443") throw new Error("Non-standard ports are not accepted.");
  if (url.hostname === "localhost" || url.hostname.endsWith(".localhost") ||
      url.hostname.endsWith(".local") || /^\d+(\.\d+){3}$/.test(url.hostname) ||
      url.hostname.includes(":")) {
    throw new Error("This host is not allowed.");
  }
  if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error("This media host is not configured as an authorized source.");
  }
  return url;
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (req.method === "GET" && requestUrl.pathname === "/health") {
    return json(res, 200, { ok: true, service: "fluxclip-media-worker" });
  }
  if (req.method !== "GET" || requestUrl.pathname !== "/download") {
    return json(res, 404, { error: "Not found." });
  }
  if (!TOKEN || req.headers.authorization !== `Bearer ${TOKEN}`) {
    return json(res, 401, { error: "Unauthorized worker request." });
  }
  const raw = requestUrl.searchParams.get("url");
  if (!raw || raw.length > 4096) return json(res, 400, { error: "A direct media URL is required." });

  let source;
  try { source = validateSource(raw); } catch (error) {
    return json(res, 400, { error: error instanceof Error ? error.message : "Invalid media URL." });
  }

  let upstream;
  try {
    upstream = await fetch(source, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
      headers: { "user-agent": "FluxclipMediaWorker/1.0" },
    });
  } catch {
    return json(res, 502, { error: "Could not reach the authorized media source." });
  }

  if (upstream.status >= 300 && upstream.status < 400) {
    await upstream.body?.cancel();
    return json(res, 400, { error: "Redirected media URLs are not accepted. Use a final, allowlisted HTTPS media URL." });
  }
  if (!upstream.ok || !upstream.body) {
    await upstream.body?.cancel();
    return json(res, 502, { error: "The source did not provide a downloadable media file." });
  }

  const type = upstream.headers.get("content-type") || "application/octet-stream";
  if (!(type.startsWith("video/") || type.startsWith("audio/") || type.startsWith("image/") ||
        type === "application/octet-stream" || type === "application/mp4")) {
    await upstream.body.cancel();
    return json(res, 415, { error: "The source response is not a supported media file." });
  }
  const length = Number(upstream.headers.get("content-length") || 0);
  if (length > MAX_BYTES) {
    await upstream.body.cancel();
    return json(res, 413, { error: "The media file exceeds the configured download limit." });
  }

  const filename = safeFilename(requestUrl.searchParams.get("filename") || "fluxclip-media");
  res.writeHead(200, {
    "content-type": type,
    "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    ...(length ? { "content-length": String(length) } : {}),
  });

  let received = 0;
  try {
    for await (const chunk of upstream.body) {
      received += chunk.byteLength;
      if (received > MAX_BYTES) {
        res.destroy(new Error("Download size limit exceeded"));
        return;
      }
      if (!res.write(chunk)) await new Promise((resolve) => res.once("drain", resolve));
    }
    res.end();
  } catch {
    res.destroy();
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Fluxclip media worker listening on ${PORT}`);
});
