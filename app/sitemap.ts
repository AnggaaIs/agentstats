import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/seo";
import { getAgents, getBundles, getWeapons } from "@/lib/valorant-api";

const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/status", changeFrequency: "hourly", priority: 0.8 },
  { path: "/community", changeFrequency: "daily", priority: 0.8 },
  { path: "/agents", changeFrequency: "weekly", priority: 0.9 },
  { path: "/agents/meta", changeFrequency: "daily", priority: 0.8 },
  { path: "/weapons", changeFrequency: "weekly", priority: 0.9 },
  { path: "/weapons/compare", changeFrequency: "monthly", priority: 0.7 },
  { path: "/bundles", changeFrequency: "weekly", priority: 0.8 },
  { path: "/maps", changeFrequency: "weekly", priority: 0.8 },
  { path: "/maps/meta", changeFrequency: "daily", priority: 0.7 },
  { path: "/leaderboard", changeFrequency: "daily", priority: 0.9 },
  { path: "/legal", changeFrequency: "monthly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "monthly", priority: 0.3 },
  { path: "/terms", changeFrequency: "monthly", priority: 0.3 },
  { path: "/cookies", changeFrequency: "monthly", priority: 0.3 },
  { path: "/acceptable-use", changeFrequency: "monthly", priority: 0.3 },
  { path: "/disclaimer", changeFrequency: "monthly", priority: 0.3 },
  { path: "/data-requests", changeFrequency: "monthly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const [agentResult, weaponResult, bundleResult] = await Promise.allSettled([
    getAgents(),
    getWeapons(),
    getBundles(),
  ]);
  const agents = agentResult.status === "fulfilled" ? agentResult.value : [];
  const weapons = weaponResult.status === "fulfilled" ? weaponResult.value : [];
  const bundles = bundleResult.status === "fulfilled" ? bundleResult.value : [];

  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
  const agentEntries = agents.map((agent) => ({
    url: `${baseUrl}/agents/${agent.uuid}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  const weaponEntries = weapons.map((weapon) => ({
    url: `${baseUrl}/weapons/${weapon.uuid}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  const skinEntries = weapons.flatMap((weapon) =>
    weapon.skins.map((skin) => ({
      url: `${baseUrl}/weapons/${weapon.uuid}/skins/${skin.uuid}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  );
  const bundleEntries = bundles.map((bundle) => ({
    url: `${baseUrl}/bundles/${bundle.uuid}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    ...staticEntries,
    ...agentEntries,
    ...weaponEntries,
    ...skinEntries,
    ...bundleEntries,
  ];
}
