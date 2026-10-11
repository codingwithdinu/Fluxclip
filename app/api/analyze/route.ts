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

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    if (
      !body ||
      typeof body !== "object" ||
      !("url" in body) ||
      typeof body.url !== "string"
    ) {
      return NextResponse.json(
        { success: false, error: "Please provide a video URL." },
        { status: 400 },
      );
    }

    const analyzed = analyzeSupportedUrl(body.url);

    if (analyzed.platform === "instagram") {
      return NextResponse.json({
        success: true,
        platform: "instagram",
        url: analyzed.canonicalUrl,
        previewUrl: analyzed.canonicalUrl,
        downloadAvailable: false,
        message:
          "Instagram preview and download access depends on the account, permissions, and supported Meta integrations. Fluxclip does not bypass private access or scrape media.",
      });
    }

    const videoId = analyzed.videoId!;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
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
      });
    }

    const apiUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    apiUrl.searchParams.set("part", "snippet,contentDetails");
    apiUrl.searchParams.set("id", videoId);
    apiUrl.searchParams.set("key", apiKey);

    const upstream = await fetch(apiUrl, {
      signal: AbortSignal.timeout(7000),
      cache: "no-store",
    });

    if (!upstream.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            upstream.status === 403
              ? "YouTube API quota or permissions issue. Check your API key and quota."
              : "YouTube couldn't provide details right now. Please try again later.",
        },
        { status: 502 },
      );
    }

    const data = (await upstream.json()) as YouTubeVideoResponse;
    const item = data.items?.[0];

    if (!item) {
      return NextResponse.json(
        { success: false, error: "This video may be unavailable or removed." },
        { status: 404 },
      );
    }

    return NextResponse.json({
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
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }
}
