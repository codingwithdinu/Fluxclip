export type Platform = "youtube" | "instagram";

export type AnalyzedUrl = {
  platform: Platform;
  canonicalUrl: string;
  videoId?: string;
};

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
]);

const INSTAGRAM_HOSTS = new Set([
  "instagram.com",
  "www.instagram.com",
]);

export function analyzeSupportedUrl(rawUrl: string): AnalyzedUrl {
  if (typeof rawUrl !== "string" || rawUrl.length > 2048) {
    throw new Error("Please enter a valid video URL.");
  }

  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new Error("That link doesn't look valid. Paste a complete URL.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Only HTTP and HTTPS links are supported.");
  }

  const host = url.hostname.toLowerCase().replace(/\.$/, "");

  if (YOUTUBE_HOSTS.has(host)) {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) {
      throw new Error("We couldn't find a video ID in that YouTube link.");
    }
    return {
      platform: "youtube",
      videoId,
      canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
    };
  }

  if (INSTAGRAM_HOSTS.has(host)) {
    const isSupportedPath = /^\/(reel|reels|p|tv)\/[A-Za-z0-9_-]+\/?$/.test(url.pathname);
    if (!isSupportedPath) {
      throw new Error("Paste a public Instagram Reel or post link.");
    }
    return {
      platform: "instagram",
      canonicalUrl: `https://www.instagram.com${url.pathname}`,
    };
  }

  throw new Error("Unsupported link. Paste a YouTube or Instagram URL.");
}

function getYouTubeVideoId(url: URL): string | undefined {
  let candidate: string | null = null;

  if (url.hostname.toLowerCase().endsWith("youtu.be")) {
    candidate = url.pathname.split("/").filter(Boolean)[0] ?? null;
  } else if (url.pathname === "/watch") {
    candidate = url.searchParams.get("v");
  } else {
    const parts = url.pathname.split("/").filter(Boolean);
    if (["shorts", "embed", "live"].includes(parts[0] ?? "")) {
      candidate = parts[1] ?? null;
    }
  }

  return candidate && /^[A-Za-z0-9_-]{11}$/.test(candidate)
    ? candidate
    : undefined;
}
