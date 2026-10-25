import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AudioProvider } from "@/components/media/audio-provider";
import { AudioDock } from "@/components/media/audio-dock";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "诗意江山｜中国古诗词赏析",
    template: "%s｜诗意江山",
  },
  description: "精选中国古典诗词，读原文、译文与创作背景，在水墨插画和古风音乐中领会诗意。",
  keywords: ["古诗词", "唐诗", "宋词", "诗词赏析", "白话译文", "中国古典文学"],
};

export const viewport: Viewport = {
  themeColor: "#f3efe5",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">跳至正文</a>
        <AudioProvider>
          <SiteHeader />
          <main id="main-content">{children}</main>
          <SiteFooter />
          <AudioDock />
        </AudioProvider>
      </body>
    </html>
  );
}
