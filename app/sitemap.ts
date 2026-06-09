import type { MetadataRoute } from "next";

const ROUTES = [
  "",
  "/meta",
  "/agents",
  "/weapons",
  "/maps",
  "/leaderboard",
  "/legal",
  "/privacy",
  "/terms",
  "/cookies",
  "/acceptable-use",
  "/disclaimer",
  "/data-requests",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return ROUTES.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
