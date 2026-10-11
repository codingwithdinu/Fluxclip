"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  Clipboard,
  Clapperboard,
  Clock3,
  Instagram,
  Link2,
  LoaderCircle,
  LockKeyhole,
  Play,
  ShieldCheck,
  Sparkles,
  Youtube,
} from "lucide-react";

type AnalyzeResult = {
  success: boolean;
  platform?: "youtube" | "instagram";
  url?: string;
  videoId?: string;
  title?: string;
  channelTitle?: string;
  duration?: string;
  thumbnail?: string;
  embedUrl?: string;
  previewUrl?: string;
  downloadAvailable?: boolean;
  message?: string;
  error?: string;
};

export default function HomePage() {
  const [platform, setPlatform] = useState<"youtube" | "instagram">("youtube");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadName, setDownloadName] = useState("");
  const [fileMessage, setFileMessage] = useState("");

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setFileMessage("");
    if (file && file.size > 500 * 1024 * 1024) {
      setSelectedFile(null);
      setDownloadName("");
      setFileMessage("Please choose a file smaller than 500 MB.");
      event.target.value = "";
      return;
    }
    if (file && !/^(video|audio|image)\//i.test(file.type)) {
      setSelectedFile(null);
      setDownloadName("");
      setFileMessage("Choose a video, audio, or image file.");
      event.target.value = "";
      return;
    }
    setSelectedFile(file);
    setDownloadName(file?.name ?? "");
  }

  function downloadSelectedFile() {
    if (!selectedFile) return;
    const safeName = downloadName.trim().replace(/[\\/:*?\"<>|]/g, "-");
    if (!safeName) {
      setFileMessage("Enter a filename before downloading.");
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = safeName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    setFileMessage("Download started. Your file never left this device.");
  }

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setCopied(false);
    setLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await response.json()) as AnalyzeResult;
      if (!response.ok || !data.success) {
        setResult({ success: false, error: data.error ?? "Unable to analyze this link." });
        return;
      }
      setResult(data);
      if (data.platform) setPlatform(data.platform);
    } catch {
      setResult({
        success: false,
        error: "Couldn't reach Fluxclip. Check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      setResult(null);
    } catch {
      setResult({
        success: false,
        error: "Clipboard access is blocked by your browser. Paste the link into the field.",
      });
    }
  }

  async function copyLink() {
    if (!result?.url) return;
    try {
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
    } catch {
      setResult({ ...result, message: "Select and copy the link manually from the input above." });
    }
  }

  const activeInstagram = platform === "instagram";

  return (
    <main className="site-shell">
      <nav className="topbar">
        <Link className="brand" href="/" aria-label="Fluxclip home">
          <span className="brand-mark"><Clapperboard size={22} strokeWidth={2.2} /></span>
          <span>flux<span className="brand-accent">clip</span></span>
        </Link>
        <div className="nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#faq">FAQ</a>
        </div>
        <a className="nav-cta" href="#downloader">Try Fluxclip <ArrowRight size={15} /></a>
      </nav>

      <section className="hero">
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={14} /> YOUR MEDIA, SIMPLIFIED</div>
          <h1>Good videos.<br /><span>One simple place.</span></h1>
          <p className="hero-subtitle">
            Preview links from your favorite platforms and manage media you own
            or have permission to save — without the clutter.
          </p>
          <div className="hero-points">
            <span><ShieldCheck size={16} /> Privacy-minded</span>
            <span><ZapIcon /> Simple by design</span>
            <span><Check size={16} /> No account needed for previews</span>
          </div>
        </div>

        <div className="product-card" id="downloader">
          <div className="card-topline">
            <div>
              <p className="card-kicker">LINK ANALYZER</p>
              <h2>What are we watching?</h2>
            </div>
            <span className="secure-pill"><LockKeyhole size={12} /> Secure</span>
          </div>

          <div className="platform-tabs" role="tablist" aria-label="Choose a platform">
            <button
              type="button"
              role="tab"
              aria-selected={!activeInstagram}
              className={`platform-tab ${!activeInstagram ? "active" : ""}`}
              onClick={() => { setPlatform("youtube"); setResult(null); }}
            >
              <Youtube size={18} /> YouTube
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeInstagram}
              className={`platform-tab ${activeInstagram ? "active" : ""}`}
              onClick={() => { setPlatform("instagram"); setResult(null); }}
            >
              <Instagram size={18} /> Instagram
            </button>
          </div>

          <form onSubmit={handleAnalyze} className="analyzer-form">
            <label className="input-label" htmlFor="video-url">Paste your video link</label>
            <div className="url-input-wrap">
              <Link2 className="url-input-icon" size={18} />
              <input
                id="video-url"
                type="url"
                inputMode="url"
                placeholder={activeInstagram ? "https://www.instagram.com/reel/..." : "https://www.youtube.com/watch?v=..."}
                value={url}
                onChange={(event) => { setUrl(event.target.value); setResult(null); }}
                required
                maxLength={2048}
                aria-describedby="url-help"
              />
              <button type="button" className="paste-button" onClick={pasteFromClipboard}>
                <Clipboard size={14} /> Paste
              </button>
            </div>
            <p className="input-help" id="url-help">Public links only. Never share your password or session cookies.</p>
            <button className="analyze-button" type="submit" disabled={loading || !url.trim()}>
              {loading ? <><LoaderCircle className="spin" size={18} /> Checking link...</> : <>Analyze link <ArrowRight size={17} /></>}
            </button>
          </form>

          {result && (
            <div className={`result-panel ${result.success ? "result-success" : "result-error"}`} aria-live="polite">
              {result.success ? (
                <>
                  <div className="result-heading"><span className="result-check"><Check size={15} /></span><div><strong>Link analyzed</strong><span>{result.platform === "youtube" ? "YouTube video" : getInstagramContentType(result.url)}</span></div></div>
                  {result.platform === "instagram" && result.embedUrl ? (
                    <>
                      <div className="instagram-preview-note">
                        <span>Preview for public posts when embedding is available.</span>
                        {result.url && <a href={result.url} target="_blank" rel="noopener noreferrer">Open on Instagram <ArrowRight size={13} /></a>}
                      </div>
                      <div className="instagram-embed-wrap">
                      <iframe
                        className="instagram-embed"
                        src={result.embedUrl}
                        title="Instagram post or Reel preview"
                        loading="lazy"
                        allow="encrypted-media; picture-in-picture; fullscreen"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                      />
                      </div>
                    </>
                  ) : result.thumbnail ? (
                    <div className="preview-card">
                      <Image src={result.thumbnail} alt="Video thumbnail" width={640} height={360} unoptimized />
                      <div className="preview-overlay"><Play size={20} fill="currentColor" /></div>
                    </div>
                  ) : null}
                  <div className="result-title">{result.title ?? "Instagram link detected"}</div>
                  {result.channelTitle && <div className="result-channel">{result.channelTitle}</div>}
                  {result.duration && <div className="result-channel">Duration: {formatDuration(result.duration)}</div>}
                  {result.platform !== "instagram" && (result.embedUrl ?? result.previewUrl) && (
                    <a
                      className="preview-link"
                      href={result.embedUrl ?? result.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open official video preview <ArrowRight size={14} />
                    </a>
                  )}
                  <p className="result-message">{result.message}</p>
                  <button type="button" className="copy-link-button" onClick={copyLink}>{copied ? <Check size={15} /> : <Clipboard size={15} />}{copied ? "Link copied" : "Copy clean link"}</button>
                </>
              ) : (
                <div className="error-row"><CircleHelp size={19} /><div><strong>We could not analyze that link</strong><p>{result.error}</p></div></div>
              )}
            </div>
          )}

          <div className="card-footnote"><LockKeyhole size={13} /> Fluxclip never asks for your social account password.</div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Product benefits">
        <div><ShieldCheck size={20} /><span><strong>Privacy first</strong><small>No passwords requested</small></span></div>
        <div><Clock3 size={20} /><span><strong>Quick link checks</strong><small>Clear feedback, no guesswork</small></span></div>
        <div><ArrowDownToLine size={20} /><span><strong>Authorized media</strong><small>Save content you have rights to</small></span></div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="section-heading">
          <span className="section-label">THREE SIMPLE STEPS</span>
          <h2>From link to clarity.</h2>
          <p>A clean workflow that tells you what is supported before you go any further.</p>
        </div>
        <div className="steps-grid">
          <article className="step-card"><span className="step-number">01</span><div className="step-icon"><Link2 size={22} /></div><h3>Paste a link</h3><p>Copy a supported YouTube or Instagram URL and drop it into Fluxclip.</p></article>
          <article className="step-card"><span className="step-number">02</span><div className="step-icon"><Sparkles size={22} /></div><h3>Analyze it</h3><p>We validate the link and show available preview details where supported.</p></article>
          <article className="step-card"><span className="step-number">03</span><div className="step-icon"><ShieldCheck size={22} /></div><h3>Choose your next step</h3><p>Open the official preview or use an authorized source for your own media.</p></article>
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div className="section-heading">
          <span className="section-label">GOOD TO KNOW</span>
          <h2>Questions, answered.</h2>
        </div>
        <div className="faq-list">
          <details><summary>Can Fluxclip download any public video? <ChevronDown size={17} /></summary><p>Not automatically. A public link does not guarantee that a platform provides a permitted direct-download URL. Fluxclip currently validates links and offers supported previews; downloads need an authorized file source.</p></details>
          <details><summary>Why is a YouTube API key optional? <ChevronDown size={17} /></summary><p>Without a key, Fluxclip can validate a video link and show its standard thumbnail and official embed. A server-side YouTube Data API key adds title, channel, and duration details.</p></details>
          <details><summary>Does Fluxclip store my links? <ChevronDown size={17} /></summary><p>Fluxclip does not save submitted full URLs in a user history. Successful YouTube metadata may be cached for six hours, and configured rate limiting processes request IP addresses. Hosting providers may retain technical logs. Read our <a href="/privacy">Privacy Policy</a> for details.</p></details>
        </div>
      </section>

      <footer className="footer">
        <Link className="brand footer-brand" href="/"><span className="brand-mark"><Clapperboard size={19} /></span><span>flux<span className="brand-accent">clip</span></span></Link>
        <p>Your media. One simple place.</p>
        <div className="footer-legal-links">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
        <span className="footer-note">Independent utility · Not affiliated with Instagram or YouTube</span>
      </footer>
    </main>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getInstagramContentType(value?: string) {
  if (!value) return "Instagram post or Reel";
  return /\/(reel|reels|tv)\//i.test(value) ? "Instagram Reel" : "Instagram post";
}

function formatDuration(value: string) {
  const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return value;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function ZapIcon() {
  return <Sparkles size={16} />;
}
