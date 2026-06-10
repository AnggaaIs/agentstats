import type { Metadata } from "next";

import { APP_NAME } from "@/lib/constants";

const DEFAULT_DESCRIPTION =
  "Explore Valorant agents, weapons, skins, bundles, maps, ranked leaderboards, service status, and player tools with AgentStats.";

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
}

export function absoluteUrl(path = "/"): string {
  return new URL(path, `${getSiteUrl()}/`).toString();
}

interface CreateMetadataOptions {
  title: string;
  description?: string;
  path: string;
  image?: string | null;
  imageAlt?: string;
  noIndex?: boolean;
  type?: "website" | "profile";
}

export function createMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image,
  imageAlt,
  noIndex = false,
  type = "website",
}: CreateMetadataOptions): Metadata {
  const canonical = absoluteUrl(path);
  const images = image
    ? [{ url: image, alt: imageAlt ?? title }]
    : [{ url: absoluteUrl("/opengraph-image"), alt: `${APP_NAME} Valorant stats` }];

  return {
    title,
    description,
    alternates: { canonical },
    robots: noIndex
      ? { index: false, follow: false, noarchive: true }
      : {
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
      type,
      url: canonical,
      siteName: APP_NAME,
      title,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((item) => item.url),
    },
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
