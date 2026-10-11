# Fluxclip

**Your media. One simple place.**

Fluxclip is an all-in-one media utility starter built with Next.js and TypeScript. The first milestone focuses on safe URL validation, platform detection, and official video previews. Download support should only be enabled for files the user owns or is authorized to download, using a permitted source or export flow.

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind-style custom CSS (no UI framework required)
- Server-side API route for URL validation and analysis

## Getting started

1. Install Node.js 20.9+.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` if you want to use the optional YouTube Data API key.
4. Start development: `npm run dev`
5. Open http://localhost:3000

## Environment variables

- `YOUTUBE_API_KEY` (optional): YouTube Data API v3 key. Keep it on the server; never expose it through a `NEXT_PUBLIC_*` variable.

Without this key, Fluxclip can still validate YouTube links and show the official YouTube embed/thumbnail. Detailed metadata requires the API key.

## Current scope

- Instagram and YouTube URL validation
- Platform detection and clear error messages
- Official YouTube embed preview
- Instagram link guidance (no scraping or private-content bypass)
- Responsive interface and loading/error states

This starter does **not** scrape platforms or bypass access controls. Platform download policies and copyright permissions must be respected. For user-owned media, add a documented authorized export/upload workflow before enabling downloads.

## Project structure

```
app/
  api/analyze/route.ts  # Server-side URL analysis endpoint
  globals.css           # App styling and responsive layout
  layout.tsx            # Root document, fonts, metadata
  page.tsx              # Main Fluxclip interface
lib/
  platform.ts           # URL parsing and platform-specific helpers
.env.example            # Optional server-only environment variables
```

## Production checklist

Before launch, configure environment variables, add request rate limiting and monitoring, test provider/API failures, add a privacy policy and terms, and only enable downloads for media that can legally and technically be delivered.
