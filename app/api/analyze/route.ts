import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { analyzeSupportedUrl } from "@/lib/platform";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VideoMetadata = {
  title: string;
  channelTitle: string;
  duration: string;
  thumbnail: string;
};

type YouTubeVideoResponse = {
  items?: Array<{
    snippet?: {
      title?: string;
      channelTitle?: string;
      thumbnails?: {
        high?: { url?: string };
        medium?: { url?: string };
        default?: { url?: string };
      };
    };
    contentDetails?: { duration?: string };
  }>;
};

const redisConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);

const redis = redisConfigured ? Redis.fromEnv() : null;
const rateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "60 s"),
      prefix: "fluxclip:rate-limit",
      analytics: false,
    })
  : null;

function jsonError(error: string, status: number, headers?: HeadersInit) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Cache-Control", "no-store");

  return NextResponse.json(
    { success: false, error },
    { status, headers: responseHeaders },
  );
}

function getClientIp(request: NextRequest) {
  // Vercel supplies these headers for incoming requests. Use the first forwarded
  // address when present, with a fallback for local development.
  const forwardedFor = request.headers.get("x-forwarded-for");
  return (
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

async function enforceRateLimit(request: NextRequest) {
  if (!rateLimiter) return null;

  try {
    const result = await rateLimiter.limit(getClientIp(request));
    if (result.success) return null;

    return jsonError("Too many requests. Please wait a minute and try again.", 429, {
      "Retry-After": String(Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))),
      "X-RateLimit-Limit": String(result.limit),
      "X-RateLimit-Remaining": String(result.remaining),
    });
  } catch (error) {
    // Keep the app available if Redis has a temporary outage. Alert in server logs.
    console.error("[Fluxclip] Redis rate-limit check failed:", error);
    return null;
  }
}

async function readCachedMetadata(videoId: string): Promise<VideoMetadata | null> {
  if (!redis) return null;
  try {
    return await redis.get<VideoMetadata>(`fluxclip:youtube:${videoId}`);
  } catch (error) {
    console.error("[Fluxclip] Redis cache read failed:", error);
    return null;
  }
}

async function cacheMetadata(videoId: string, metadata: VideoMetadata) {
  if (!redis) return;
  try {
    // Cache successful metadata for six hours to reduce repeat YouTube API calls.
    await redis.set(`fluxclip:youtube:${videoId}`, metadata, { ex: 21600 });
  } catch (error) {
    console.error("[Fluxclip] Redis cache write failed:", error);
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await enforceRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("url" in body) ||
    typeof body.url !== "string" ||
    !body.url.trim()
  ) {
    return jsonError("Please provide a video URL.", 400);
  }

  let analyzed: ReturnType<typeof analyzeSupportedUrl>;

  try {
    analyzed = analyzeSupportedUrl(body.url);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Please enter a valid video URL.",
      400,
    );
  }

  if (analyzed.platform === "instagram") {
    return NextResponse.json(
      {
        success: true,
        platform: "instagram",
        url: analyzed.canonicalUrl,
        previewUrl: analyzed.canonicalUrl,
        embedUrl: `${analyzed.canonicalUrl.replace(/\/$/, "")}/embed/`,
        downloadAvailable: false,
        message:
          "If the public post supports embedding, its official Instagram preview appears below. Private, removed, age-restricted, or embed-disabled posts may not display. Fluxclip does not scrape media or bypass access controls.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const videoId = analyzed.videoId;
  if (!videoId) {
    return jsonError("We couldn't find a video ID in that YouTube link.", 400);
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        success: true,
        platform: "youtube",
        videoId,
        url: analyzed.canonicalUrl,
        title: "YouTube video",
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
        downloadAvailable: false,
        metadataSource: "youtube-thumbnail",
        message:
          "Preview is ready. Add YOUTUBE_API_KEY to fetch video metadata. YouTube's Data API does not provide a general MP4 download URL.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const cached = await readCachedMetadata(videoId);
  if (cached) {
    return NextResponse.json(
      {
        success: true,
        platform: "youtube",
        videoId,
        url: analyzed.canonicalUrl,
        ...cached,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
        downloadAvailable: false,
        metadataSource: "youtube-data-api-cache",
        message: "Preview is ready.",
      },
      { headers: { "Cache-Control": "no-store", "X-Fluxclip-Cache": "HIT" } },
    );
  }

  const apiUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  apiUrl.searchParams.set("part", "snippet,contentDetails");
  apiUrl.searchParams.set("id", videoId);
  apiUrl.searchParams.set("key", apiKey);

  let upstream: Response;
  try {
    upstream = await fetch(apiUrl, {
      signal: AbortSignal.timeout(7000),
      cache: "no-store",
    });
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");

    return jsonError(
      timedOut
        ? "YouTube took too long to respond. Please try again."
        : "Couldn't connect to YouTube right now. Please try again later.",
      timedOut ? 504 : 502,
    );
  }

  if (!upstream.ok) {
    if (upstream.status === 403 || upstream.status === 429) {
      return jsonError(
        "YouTube API quota or permissions issue. Check the API key, enabled API, and quota in Google Cloud.",
        503,
      );
    }
    return jsonError(
      "YouTube couldn't provide details right now. Please try again later.",
      502,
    );
  }

  let data: YouTubeVideoResponse;
  try {
    data = (await upstream.json()) as YouTubeVideoResponse;
  } catch {
    return jsonError("YouTube returned an unexpected response. Please try again.", 502);
  }

  const item = data.items?.[0];

  if (!item) {
    return jsonError("This video may be unavailable or removed.", 404);
  }

  const metadata: VideoMetadata = {
    title: item.snippet?.title ?? "YouTube video",
    channelTitle: item.snippet?.channelTitle ?? "",
    duration: item.contentDetails?.duration ?? "",
    thumbnail:
      item.snippet?.thumbnails?.high?.url ??
      item.snippet?.thumbnails?.medium?.url ??
      item.snippet?.thumbnails?.default?.url ??
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };

  await cacheMetadata(videoId, metadata);

  return NextResponse.json(
    {
      success: true,
      platform: "youtube",
      videoId,
      url: analyzed.canonicalUrl,
      ...metadata,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
      downloadAvailable: false,
      metadataSource: "youtube-data-api",
      message:
        "Preview is ready. Downloading directly from YouTube is not provided by the Data API.",
    },
    { headers: { "Cache-Control": "no-store", "X-Fluxclip-Cache": "MISS" } },
  );
}
