import assert from "node:assert/strict";
import test from "node:test";
import { analyzeSupportedUrl } from "../lib/platform";

test("normalizes YouTube watch URLs and ignores tracking parameters", () => {
  const result = analyzeSupportedUrl(
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ&si=tracking",
  );
  assert.equal(result.platform, "youtube");
  assert.equal(result.videoId, "dQw4w9WgXcQ");
  assert.equal(result.canonicalUrl, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
});

test("supports youtu.be, Shorts, and live video URL formats", () => {
  assert.equal(
    analyzeSupportedUrl("https://youtu.be/dQw4w9WgXcQ").videoId,
    "dQw4w9WgXcQ",
  );
  assert.equal(
    analyzeSupportedUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ").videoId,
    "dQw4w9WgXcQ",
  );
  assert.equal(
    analyzeSupportedUrl("https://www.youtube.com/live/dQw4w9WgXcQ").videoId,
    "dQw4w9WgXcQ",
  );
});

test("normalizes Instagram Reel URLs and removes query parameters", () => {
  const result = analyzeSupportedUrl(
    "https://www.instagram.com/reel/ABC_def-123/?igsh=tracking",
  );
  assert.equal(result.platform, "instagram");
  assert.equal(result.canonicalUrl, "https://www.instagram.com/reel/ABC_def-123/");
});

test("accepts Instagram posts and TV links", () => {
  assert.equal(
    analyzeSupportedUrl("https://instagram.com/p/ABC123/").canonicalUrl,
    "https://www.instagram.com/p/ABC123/",
  );
  assert.equal(
    analyzeSupportedUrl("https://instagram.com/tv/ABC123/").platform,
    "instagram",
  );
});

test("rejects malformed URLs, unsupported hosts, and non-web protocols", () => {
  assert.throws(() => analyzeSupportedUrl("not a URL"), /complete URL/i);
  assert.throws(() => analyzeSupportedUrl("javascript:alert(1)"), /HTTP and HTTPS/i);
  assert.throws(() => analyzeSupportedUrl("https://example.com/video"), /Unsupported link/i);
  assert.throws(
    () => analyzeSupportedUrl("https://www.instagram.com/accounts/login/"),
    /public Instagram Reel or post/i,
  );
});

test("rejects YouTube URLs without a valid 11-character video ID", () => {
  assert.throws(
    () => analyzeSupportedUrl("https://www.youtube.com/watch?v=short"),
    /video ID/i,
  );
});

test("rejects overly long URL input", () => {
  assert.throws(
    () => analyzeSupportedUrl("https://www.youtube.com/" + "a".repeat(2050)),
    /valid video URL/i,
  );
});
