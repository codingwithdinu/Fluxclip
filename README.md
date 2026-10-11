# Fluxclip

**Your media. One simple place.**

Fluxclip is an all-in-one media utility starter built with Next.js and TypeScript. The first milestone focuses on safe URL validation, platform detection, and official video previews. Download support should only be enabled for files the user owns or is authorized to download, using a permitted source or export flow.

## Stack

- Next.js App Router
- React + TypeScript
- Server-side API route for URL validation and analysis
- Optional Upstash Redis for shared caching and rate limiting

## Getting started

1. Install Node.js 20.9+.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` if you want to use the optional API integrations.
4. Start development: `npm run dev`
5. Open http://localhost:3000

## Environment variables

- `YOUTUBE_API_KEY` (optional): YouTube Data API v3 key. Keep it on the server; never expose it through a `NEXT_PUBLIC_*` variable.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (optional): Upstash Redis REST credentials. Configure both in Vercel to enable shared metadata caching and a limit of 20 analysis requests per IP per 60 seconds.

Without the YouTube key, Fluxclip can still validate YouTube links and show the official YouTube embed/thumbnail. Detailed metadata requires the API key. Without Upstash credentials, Redis features are skipped and the basic URL-analysis flow continues to work. If Redis has a temporary error, the endpoint logs the issue and continues without cache/rate-limit enforcement so a Redis outage does not take the whole app offline.

## Current scope

- Instagram and YouTube URL validation
- Platform detection and clear error messages
- Official YouTube embed preview and thumbnail fallback
- Optional YouTube title, channel, and duration metadata through the server-side Data API key
- Six-hour shared Redis cache for successful YouTube metadata responses
- Optional Redis-backed sliding-window rate limit of 20 requests per IP per 60 seconds
- Instagram link guidance with a direct link back to the original post/Reel (no scraping or private-content bypass)
- User-friendly API errors for malformed requests, upstream failures, quota issues, and timeouts
- Responsive interface and loading/error states

This starter does **not** scrape platforms or bypass access controls. Platform download policies and copyright permissions must be respected. For user-owned media, add a documented authorized export/upload workflow before enabling downloads.

## Project structure

```
app/
  api/analyze/route.ts  # Server-side URL analysis, caching, and rate limiting
  globals.css           # App styling and responsive layout
  layout.tsx            # Root document, fonts, metadata
  page.tsx              # Main Fluxclip interface
lib/
  platform.ts           # URL parsing and platform-specific helpers
.env.example            # Optional server-only environment variables
```

## Production checklist

Before launch, configure environment variables, add monitoring, test provider/API failures, test rate limiting with multiple requests, add a privacy policy and terms, and only enable downloads for media that can legally and technically be delivered.
