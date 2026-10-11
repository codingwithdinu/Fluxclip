# Fluxclip media worker

This service streams **direct media-file URLs from authorized, allowlisted HTTPS hosts**. It does not extract MP4 files from YouTube or Instagram page URLs, scrape platform pages, bypass access controls, or resolve redirects.

## Endpoints

- `GET /health` — health check.
- `GET /download?url=<encoded-direct-media-url>&filename=<optional-name>` — streams a direct media file; requires `Authorization: Bearer <WORKER_API_TOKEN>`.

## Worker environment

- `PORT` (default `8080`)
- `WORKER_API_TOKEN` (required; long random secret)
- `ALLOWED_MEDIA_HOSTS` (required; comma-separated exact hostnames for media sources you control or are authorized to use)
- `MAX_DOWNLOAD_BYTES` (optional; defaults to 500 MiB)

Do not use broad host wildcards. Only allow hosts whose files you have permission to redistribute. The service rejects non-HTTPS URLs, IP literals, credentials, non-standard ports, redirects, non-media responses, and oversized files.

## Deploy on Render

1. Create a **Web Service** from the Fluxclip GitHub repository.
2. Set the Root Directory to `worker`.
3. Select Docker as the runtime (it uses `worker/Dockerfile`).
4. Configure `WORKER_API_TOKEN`, `ALLOWED_MEDIA_HOSTS`, and optionally `MAX_DOWNLOAD_BYTES` in Render's environment settings.
5. Deploy and verify `https://YOUR-WORKER.onrender.com/health` returns `{"ok":true,"service":"fluxclip-media-worker"}`.

## Connect Vercel

In the Vercel project settings, add these server-only environment variables for Production (and Preview if needed):

- `MEDIA_WORKER_URL` = the worker base URL, e.g. `https://YOUR-WORKER.onrender.com` (no trailing path)
- `MEDIA_WORKER_API_TOKEN` = the exact same secret as `WORKER_API_TOKEN`

Redeploy the Next.js app after setting the variables. Never use a `NEXT_PUBLIC_` prefix for the token.

## Integration status and limitation

The Next.js `/api/download` route proxies downloads through this worker without exposing its token to the browser. It requires a **direct media URL** and the worker's allowlist must include that exact media host.

The current YouTube/Instagram analyzer does not obtain an authorized direct media URL from social permalinks. YouTube's Data API is metadata-only; Instagram media access depends on applicable Meta API permissions and supported account/content types. Therefore social-link downloads are **not yet wired up**. Do not add a Download button for those links until a permitted provider integration supplies a direct media source.
