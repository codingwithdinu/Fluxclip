import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Fluxclip",
  description: "Learn what Fluxclip processes when you analyze YouTube and Instagram links.",
};

export default function PrivacyPage() {
  return (
    <main className="legal-shell">
      <Link className="legal-back" href="/">← Back to Fluxclip</Link>
      <article className="legal-card">
        <p className="section-label">FLUXCLIP · LEGAL</p>
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: October 11, 2026</p>
        <p>Fluxclip helps you validate supported YouTube and Instagram links and view official previews where available. This page explains the information the current version of Fluxclip processes.</p>

        <h2>Information you provide</h2>
        <p>When you submit a link, the URL is sent to the Fluxclip analysis API to identify the supported platform and prepare a preview. Avoid submitting private links or URLs that contain personal access tokens.</p>

        <h2>Service providers and metadata</h2>
        <p>For YouTube metadata, Fluxclip may contact the YouTube Data API using a server-side API key. Successful YouTube metadata may be cached in Upstash Redis for up to six hours to reduce repeat API calls. The cache is keyed by the YouTube video ID and stores metadata such as title, channel, duration, and thumbnail—not the submitted full URL.</p>
        <p>Instagram previews are loaded from Instagram through an embedded frame. When you view that frame or follow an Instagram link, Instagram may receive information according to its own privacy policy and settings.</p>

        <h2>Rate limiting, logs, and hosting</h2>
        <p>If Redis rate limiting is configured, Fluxclip uses a request IP address to apply a per-IP request limit. The hosting platform and service providers may process technical information such as IP address, request details, and diagnostic logs to operate and secure the service. Do not assume that network providers retain no technical logs.</p>

        <h2>Cookies and accounts</h2>
        <p>The current Fluxclip interface does not require an account and does not ask for your social-media password or session cookies. Embedded third-party services may use their own cookies or similar technologies.</p>

        <h2>Retention and your choices</h2>
        <p>Cached YouTube metadata is configured to expire after six hours. Rate-limit data is managed by the rate-limiting service. Hosting and provider logs may follow their own retention periods. You can choose not to use Fluxclip or avoid loading third-party previews.</p>

        <h2>Children and changes</h2>
        <p>Fluxclip is not designed to collect personal information from children. This policy may be updated as the product changes; the date above will be revised when changes are made.</p>

        <h2>Contact</h2>
        <p>A contact email for privacy requests should be published here before a public launch. This page is a product disclosure draft and is not legal advice; review it against your actual hosting, logging, and legal requirements before relying on it.</p>
      </article>
    </main>
  );
}
