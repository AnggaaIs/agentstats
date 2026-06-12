import type { Metadata } from "next";

import { CatalogBrowser } from "@/components/catalog-browser";
import { PageHeading } from "@/components/page-heading";
import { RouteLink } from "@/components/route-link";
import { getCurrentFavoritesOrEmpty } from "@/lib/community";
import { createMetadata } from "@/lib/seo";
import { getWeapons } from "@/lib/valorant-api";

export const metadata: Metadata = createMetadata({
  title: "Valorant Weapons, Damage Stats & Skins",
  description:
    "Compare Valorant weapons by damage, fire rate, price, magazine, penetration, handling, and available skin collections.",
  path: "/weapons",
});

export default async function WeaponsPage() {
  const [weapons, favorites] = await Promise.all([
    getWeapons(),
    getCurrentFavoritesOrEmpty(),
  ]);

  return (
    <section className="mx-auto max-w-[86rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeading
        eyebrow={`${weapons.length} weapons`}
        title="Weapon vault"
        description="Compare price, firepower, magazine size, and available collections."
      />
      <div className="mt-6 flex flex-wrap gap-2">
        <RouteLink
          href="/weapons/compare"
          className="valorant-action inline-flex min-h-10 items-center border border-[var(--accent)] bg-[var(--accent)] px-4 text-[11px] font-black uppercase tracking-[0.12em]"
        >
          Open weapon comparison
        </RouteLink>
        <RouteLink
          href="/bundles"
          className="valorant-action inline-flex min-h-10 items-center border border-white/15 px-4 text-[11px] font-black uppercase tracking-[0.12em]"
        >
          Browse bundle archive
        </RouteLink>
      </div>
      <CatalogBrowser
        items={weapons.map((weapon) => {
          const group =
            weapon.shopData?.category ??
            weapon.category.split("::").at(-1) ??
            "Other";
          return {
            id: weapon.uuid,
            href: `/weapons/${weapon.uuid}`,
            image: weapon.displayIcon,
            title: weapon.displayName,
            meta: `${group} · ${
              weapon.shopData ? `${weapon.shopData.cost} credits` : "Standard"
            }`,
            group,
            variant: "wide" as const,
            imageFit: "contain" as const,
          };
        })}
        groups={[
          ...new Set(
            weapons.map(
              (weapon) =>
                weapon.shopData?.category ??
                weapon.category.split("::").at(-1) ??
                "Other",
            ),
          ),
        ]}
        columns="three"
        paginate={false}
        searchPlaceholder="Search weapons or categories"
        favoriteCategory="weapon"
        initialFavoriteIds={
          favorites.weapon ? { default: favorites.weapon } : {}
        }
      />
    </section>
  );
}
