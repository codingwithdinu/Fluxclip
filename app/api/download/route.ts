import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { success: false, error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(request: NextRequest) {
  const workerUrl = process.env.MEDIA_WORKER_URL;
  const workerToken = process.env.MEDIA_WORKER_API_TOKEN;

  if (!workerUrl || !workerToken) {
    return errorResponse(
      "Authorized downloads are not configured yet. The media worker must be deployed first.",
      503,
    );
  }

  const source = request.nextUrl.searchParams.get("url");
  const filename = request.nextUrl.searchParams.get("filename") || "fluxclip-media";
  if (!source || source.length > 4096) {
    return errorResponse("A direct, authorized media-file URL is required.", 400);
  }
  if (filename.length > 180 || /[\r\n]/.test(filename)) {
    return errorResponse("Invalid download filename.", 400);
  }

  let upstreamUrl: URL;
  try {
    upstreamUrl = new URL("/download", workerUrl);
    upstreamUrl.searchParams.set("url", source);
    upstreamUrl.searchParams.set("filename", filename);
  } catch {
    return errorResponse("The configured media worker URL is invalid.", 500);
  }

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${workerToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    return errorResponse("The media worker could not be reached. Please try again later.", 502);
  }

  if (!upstream.ok || !upstream.body) {
    let message = "The authorized media source could not be downloaded.";
    try {
      const payload = (await upstream.json()) as { error?: string };
      if (payload.error) message = payload.error;
    } catch {
      // Keep the safe generic message if the worker response is not JSON.
    }
    return errorResponse(message, upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502);
  }

  const headers = new Headers({
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
    "Content-Disposition": upstream.headers.get("content-disposition") || 'attachment; filename="fluxclip-media"',
  });
  const length = upstream.headers.get("content-length");
  if (length) headers.set("Content-Length", length);

  return new Response(upstream.body, { status: 200, headers });
}
