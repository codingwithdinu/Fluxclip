import { NextRequest, NextResponse } from "next/server";
import { analyzeSupportedUrl } from "@/lib/platform";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function jsonError(error: string, status: number) {
  return NextResponse.json(
    { success: false, error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
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
        downloadAvailable: false,
        message:
          "Instagram preview and download access depends on the account, permissions, and supported Meta integrations. Fluxclip does not bypass private access or scrape media.",
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

  return NextResponse.json(
    {
      success: true,
      platform: "youtube",
      videoId,
      url: analyzed.canonicalUrl,
      title: item.snippet?.title ?? "YouTube video",
      channelTitle: item.snippet?.channelTitle ?? "",
      duration: item.contentDetails?.duration ?? "",
      thumbnail:
        item.snippet?.thumbnails?.high?.url ??
        item.snippet?.thumbnails?.medium?.url ??
        item.snippet?.thumbnails?.default?.url ??
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
      downloadAvailable: false,
      message:
        "Preview is ready. Downloading directly from YouTube is not provided by the Data API.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
