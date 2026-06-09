import type { Metadata } from "next";

import { CatalogBrowser } from "@/components/catalog-browser";
import { PageHeading } from "@/components/page-heading";
import { getMaps } from "@/lib/valorant-api";

export const metadata: Metadata = {
  title: "Maps",
  description: "Explore the Valorant map pool and tactical layouts.",
};

function getMapGroup(mapUrl: string): string {
  const normalized = mapUrl.toLocaleLowerCase();

  if (normalized.includes("/hurm/")) return "Team Deathmatch";
  if (normalized.includes("/duel/")) return "Duel";
  if (normalized.includes("/npev2/")) return "Training";
  return "Standard";
}

export default async function MapsPage() {
  const maps = await getMaps();
  const items = maps.map((map) => {
    const group = getMapGroup(map.mapUrl);

    return {
      id: map.uuid,
      image: map.splash,
      title: map.displayName,
      meta: `${group} · ${
        map.tacticalDescription ?? map.coordinates ?? "Arena"
      }`,
      group,
      variant: "wide" as const,
    };
  });

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
      <PageHeading
        eyebrow={`${maps.length} maps`}
        title="Battlefields"
        description="Explore each arena, location, and tactical layout."
      />
      <CatalogBrowser
        items={items}
        groups={[...new Set(items.map((item) => item.group))]}
        columns="two"
        perPage={6}
        searchPlaceholder="Search maps or modes"
      />
    </section>
  );
}
