import Link from "next/link";

export const metadata = {
  title: "Terms of Use | Fluxclip",
  description: "Terms for using Fluxclip's link analysis and official preview features.",
};

export default function TermsPage() {
  return (
    <main className="legal-shell">
      <Link className="legal-back" href="/">← Back to Fluxclip</Link>
      <article className="legal-card">
        <p className="section-label">FLUXCLIP · LEGAL</p>
        <h1>Terms of Use</h1>
        <p className="legal-updated">Last updated: October 11, 2026</p>
        <p>By using Fluxclip, you agree to use the service lawfully and in accordance with these terms. If you do not agree, do not use the service.</p>

        <h2>What Fluxclip does</h2>
        <p>Fluxclip validates supported YouTube and Instagram URLs and may display official previews or metadata. Features can change, become unavailable, or depend on third-party services. Fluxclip does not guarantee that every link or embed will work.</p>

        <h2>Rights and permissions</h2>
        <p>You are responsible for having the rights and permissions required for any media you access, save, upload, or share. A public URL does not automatically grant permission to download, reproduce, or redistribute its content. Use platform-provided tools and authorized export or download workflows.</p>

        <h2>Acceptable use</h2>
        <p>Do not use Fluxclip to violate copyright, bypass access controls, access private content without authorization, interfere with platform services, submit malicious links, or abuse the service. Do not submit passwords, session cookies, or private access tokens.</p>

        <h2>Third-party services</h2>
        <p>YouTube and Instagram are independent services with their own terms, privacy policies, and availability. Fluxclip is not affiliated with or endorsed by YouTube, Instagram, Google, or Meta. Third-party embeds and APIs may stop working or impose their own restrictions.</p>

        <h2>Availability and disclaimers</h2>
        <p>Fluxclip is provided on an “as available” basis without a guarantee of uninterrupted service, accuracy, or fitness for a particular purpose, to the extent permitted by applicable law. Nothing in these terms excludes rights that cannot legally be excluded.</p>

        <h2>Changes and contact</h2>
        <p>These terms may be updated as Fluxclip evolves. Add a monitored contact address and review these terms with qualified counsel before a public commercial launch.</p>
      </article>
    </main>
  );
}
