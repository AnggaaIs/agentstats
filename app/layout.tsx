import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteFooter } from "@/components/site-footer";
import {
  SiteHeader,
  type HeaderStatusNotice,
} from "@/components/site-header";
import { APP_NAME, REGIONS } from "@/lib/constants";
import {
  getPlatformStatus,
  getStatusText,
  isActiveStatusNotice,
} from "@/lib/riot";

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: `${APP_NAME} | Valorant Stats`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "Find Valorant players and explore agents, weapons, maps, and leaderboards.",
  applicationName: APP_NAME,
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: `${APP_NAME} | Valorant Stats`,
    description:
      "Explore Valorant agents, weapons, maps, official leaderboards, and player profiles with permission.",
  },
  twitter: {
    card: "summary",
    title: `${APP_NAME} | Valorant Stats`,
    description:
      "Explore Valorant agents, weapons, maps, official leaderboards, and player profiles with permission.",
  },
};

async function getHeaderStatus(): Promise<HeaderStatusNotice | null> {
  try {
    const results = await Promise.allSettled(
      REGIONS.map((region) => getPlatformStatus(region)),
    );
    const activeNotices = results.flatMap((result) => {
      if (result.status !== "fulfilled") return [];

      return [
        ...result.value.incidents,
        ...result.value.maintenances,
      ]
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const statusNotice = await getHeaderStatus();

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="sr-only z-[100] bg-white px-4 py-3 text-black focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
        >
          Skip navigation
        </a>
        <SiteHeader statusNotice={statusNotice} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
