import type { Metadata } from "next";

import { CatalogBrowser } from "@/components/catalog-browser";
import { PageHeading } from "@/components/page-heading";
import { getCurrentFavoritesOrEmpty } from "@/lib/community";
import { createMetadata } from "@/lib/seo";
import { getMaps } from "@/lib/valorant-api";

export const metadata: Metadata = createMetadata({
  title: "Valorant Maps & Tactical Layouts",
  description:
    "Browse the Valorant map pool, locations, tactical descriptions, and layouts for standard, training, duel, and team deathmatch arenas.",
  path: "/maps",
});

function getMapGroup(mapUrl: string): string {
  const normalized = mapUrl.toLocaleLowerCase();

  if (normalized.includes("/hurm/")) return "Team Deathmatch";
  if (normalized.includes("/duel/")) return "Duel";
  if (normalized.includes("/npev2/")) return "Training";
  return "Standard";
}

export default async function MapsPage() {
  const [maps, favorites] = await Promise.all([
    getMaps(),
    getCurrentFavoritesOrEmpty(),
  ]);
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
    <section className="mx-auto max-w-[86rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
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
        favoriteCategory="map"
        initialFavoriteIds={
          favorites.map ? { default: favorites.map } : {}
        }
      />
    </section>
  );
}
