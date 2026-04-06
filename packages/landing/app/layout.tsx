import type { Metadata } from "next";
import { spaceGrotesk, jetbrainsMono } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Camaleon — Context Engine | Your AI finally remembers.",
  description:
    "Persistent memory for Claude Code and Copilot CLI. Semantic search, multi-agent sessions, 12 MCP tools. Open source.",
  openGraph: {
    title: "Camaleon — Context Engine",
    description: "Your AI finally remembers.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="scanlines">{children}</body>
    </html>
  );
}
