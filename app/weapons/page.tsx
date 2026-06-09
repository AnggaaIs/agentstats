import type { Metadata } from "next";

import { CatalogBrowser } from "@/components/catalog-browser";
import { PageHeading } from "@/components/page-heading";
import { getWeapons } from "@/lib/valorant-api";

export const metadata: Metadata = {
  title: "Weapons",
  description: "Explore Valorant weapon handling, damage, economy, and skins.",
};

export default async function WeaponsPage() {
  const weapons = await getWeapons();

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
      <PageHeading
        eyebrow={`${weapons.length} weapons`}
        title="Weapon vault"
        description="Compare price, firepower, magazine size, and available collections."
      />
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
        perPage={9}
        searchPlaceholder="Search weapons or categories"
      />
    </section>
  );
}
