import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";

import { auth } from "@/auth";
import { GoogleAnalytics } from "@/components/google-analytics";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader, type HeaderStatusNotice } from "@/components/site-header";
import { isRsoConfigured } from "@/lib/auth-config";
import { APP_NAME, REGIONS } from "@/lib/constants";
import {
  getPlatformStatus,
  getStatusText,
  isActiveStatusNotice,
} from "@/lib/riot";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${APP_NAME} - Valorant Stats, Agents, Skins & Leaderboards`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "Explore Valorant agents, weapons, skins, bundles, maps, ranked leaderboards, service status, and player tools with AgentStats.",
  applicationName: APP_NAME,
  category: "gaming",
  keywords: [
    "Valorant stats",
    "Valorant agents",
    "Valorant weapons",
    "Valorant skins",
    "Valorant bundles",
    "Valorant leaderboard",
    "Valorant service status",
  ],
  referrer: "origin-when-cross-origin",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: APP_NAME,
    locale: "en_US",
    title: `${APP_NAME} - Valorant Stats, Agents, Skins & Leaderboards`,
    description:
      "Explore Valorant agents, weapons, skins, bundles, maps, ranked leaderboards, and live Riot service status.",
    images: [{ url: "/opengraph-image", alt: "AgentStats Valorant stats" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} - Valorant Stats, Agents, Skins & Leaderboards`,
    description:
      "Explore Valorant agents, weapons, skins, bundles, maps, ranked leaderboards, and live Riot service status.",
    images: ["/opengraph-image"],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b1016",
  colorScheme: "dark",
};

async function getHeaderStatus(): Promise<HeaderStatusNotice | null> {
  try {
    const results = await Promise.allSettled(
      REGIONS.map((region) => getPlatformStatus(region)),
    );
    const activeNotices = results.flatMap((result) => {
      if (result.status !== "fulfilled") return [];

      return [...result.value.incidents, ...result.value.maintenances]
        .filter((notice) => isActiveStatusNotice(notice))
        .map((notice) => ({ notice }));
    });
    const active = activeNotices.sort(
      (left, right) =>
        new Date(right.notice.created_at).getTime() -
        new Date(left.notice.created_at).getTime(),
    )[0];

    if (!active) return null;

    const latestUpdate = active.notice.updates
      .filter((update) => update.publish)
      .at(-1);
    const severity =
      active.notice.incident_severity === "critical"
        ? "critical"
        : active.notice.incident_severity === "warning"
          ? "warning"
          : "info";

    return {
      severity,
      title: getStatusText(active.notice.titles),
      message: latestUpdate
        ? getStatusText(latestUpdate.translations)
        : "Riot has not published an additional update.",
      date: new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Jakarta",
      }).format(new Date(active.notice.created_at)),
    };
  } catch {
    return null;
  }
}

async function SiteHeaderWithData() {
  const [statusNotice, session] = await Promise.all([
    getHeaderStatus(),
    isRsoConfigured() ? auth() : Promise.resolve(null),
  ]);
  const account = isRsoConfigured()
    ? {
        href: session?.user ? "/account" : "/login",
        label: session?.user?.gameName ?? "Connect Riot",
      }
    : null;

  return <SiteHeader statusNotice={statusNotice} account={account} />;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: APP_NAME,
      url: getSiteUrl(),
      logo: absoluteUrl("/brand/agentstats-mark-512.png"),
      description:
        "An independent Valorant statistics and game reference project.",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: APP_NAME,
      url: getSiteUrl(),
      description:
        "Valorant agents, weapons, skins, bundles, maps, leaderboards, service status, and player tools.",
    },
  ];

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <JsonLd data={structuredData} />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="sr-only z-[100] bg-white px-4 py-3 text-black focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
        >
          Skip navigation
        </a>
        <Suspense
          fallback={<SiteHeader statusNotice={null} account={null} />}
        >
          <SiteHeaderWithData />
        </Suspense>
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
