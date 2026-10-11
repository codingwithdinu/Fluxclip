# Fluxclip media worker

A separate Node.js service for streaming a **direct, authorized media-file URL** to a user as an attachment. It deliberately does not extract media from YouTube/Instagram page URLs, scrape platforms, bypass access controls, or resolve redirects.

## Endpoints

- `GET /health` — health check.
- `GET /download?url=<encoded-direct-media-url>&filename=<optional-name>` — streams a direct media file.

The download endpoint requires `Authorization: Bearer <WORKER_API_TOKEN>`.

## Environment

- `PORT` (default `8080`)
- `WORKER_API_TOKEN` (required; use a long random secret)
- `ALLOWED_MEDIA_HOSTS` (required; comma-separated exact hostnames for media sources you control or are authorized to use)
- `MAX_DOWNLOAD_BYTES` (optional; defaults to 500 MiB)

Example:

```sh
PORT=8080
WORKER_API_TOKEN=replace-with-a-long-random-secret
ALLOWED_MEDIA_HOSTS=media.example.com,downloads.example.com
MAX_DOWNLOAD_BYTES=524288000
```

Do not use broad host wildcards. Only allow hosts whose files you have permission to redistribute. The service rejects non-HTTPS URLs, IP literals, credentials, non-standard ports, redirects, non-media responses, and oversized files.

## Run locally

```sh
npm start
```

## Deployment notes

Deploy this directory as a Docker web service (for example, on Render). Configure the environment variables above in the service dashboard, not in Git. Set a strong worker token and restrict network access if your hosting provider supports it.

## Important integration limitation

This worker only streams a direct media URL that is already authorized and hosted on an allowlisted domain. It does **not** turn a YouTube or Instagram permalink into a downloadable MP4. The existing Fluxclip analyzer does not currently obtain an authorized direct media URL from either platform, so social-link downloads are not yet wired up. YouTube's Data API is metadata-only; Instagram media access depends on applicable Meta API permissions and supported account/content types. Do not enable a Download button for social links until a permitted provider integration supplies the actual media URL.
