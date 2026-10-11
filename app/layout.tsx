import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fluxclip — Your media, one simple place",
  description:
    "A clean, simple place to preview supported social videos and manage media you own or are authorized to download.",
  applicationName: "Fluxclip",
  metadataBase: new URL("https://fluxclip.example"),
  openGraph: {
    title: "Fluxclip",
    description: "Your media. One simple place.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b12",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
