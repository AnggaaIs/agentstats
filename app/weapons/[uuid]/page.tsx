import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { CatalogBrowser } from "@/components/catalog-browser";
import { FavoriteButton } from "@/components/favorite-button";
import { JsonLd } from "@/components/json-ld";
import { RouteLink } from "@/components/route-link";
import { getCurrentFavorites } from "@/lib/community";
import { breadcrumbJsonLd, createMetadata } from "@/lib/seo";
import { getContentTiers, getWeapon } from "@/lib/valorant-api";

interface WeaponPageProps {
  params: Promise<{ uuid: string }>;
}

export async function generateMetadata({
  params,
}: WeaponPageProps): Promise<Metadata> {
  try {
    const { uuid } = await params;
    const weapon = await getWeapon(uuid);
    const category = weapon.shopData?.category ?? "Valorant weapon";
    return createMetadata({
      title: `${weapon.displayName} - Damage Stats, Price & Skins`,
      description: `Explore ${weapon.displayName} ${category.toLowerCase()} damage, fire rate, magazine, reload, price, handling, and every available Valorant skin.`,
      path: `/weapons/${uuid}`,
      image: weapon.displayIcon,
      imageAlt: `${weapon.displayName} Valorant weapon`,
    });
  } catch {
    return createMetadata({
      title: "Weapon not found",
      path: "/weapons",
      noIndex: true,
    });
  }
}

export default async function WeaponPage({ params }: WeaponPageProps) {
  const { uuid } = await params;
  let weapon;
  let favorites;
  let contentTiers;

  try {
    [weapon, favorites, contentTiers] = await Promise.all([
      getWeapon(uuid),
      getCurrentFavorites(),
      getContentTiers(),
    ]);
  } catch {
    notFound();
  }

  const stats = weapon.weaponStats;
  const metrics = stats
    ? [
        ["Fire rate", `${stats.fireRate}/s`],
        ["Magazine", `${stats.magazineSize}`],
        ["Reload", `${stats.reloadTimeSeconds}s`],
        ["Equip", `${stats.equipTimeSeconds}s`],
      ]
    : [];

  return (
    <article className="mx-auto max-w-[86rem] px-4 py-9 sm:px-6 lg:px-8 lg:py-11">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Valorant Weapons", path: "/weapons" },
          { name: weapon.displayName, path: `/weapons/${weapon.uuid}` },
        ])}
      />
      <header className="grid items-center gap-7 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <p className="eyebrow">{weapon.shopData?.category ?? "Weapon"}</p>
          <h1 className="responsive-text mt-4 font-display text-[clamp(2.6rem,14vw,5rem)] font-black uppercase leading-[0.87] tracking-[-0.06em]">
            {weapon.displayName}
          </h1>
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            {weapon.shopData ? `${weapon.shopData.cost} credits` : "Standard weapon"}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <RouteLink
              href={`/weapons/compare?a=${weapon.uuid}`}
              className="valorant-action inline-flex min-h-10 items-center border border-[var(--accent)] bg-[var(--accent)] px-4 text-[11px] font-black uppercase tracking-[0.12em]"
            >
              Compare this weapon
            </RouteLink>
            <FavoriteButton
              category="weapon"
              targetId={weapon.uuid}
              targetName={weapon.displayName}
              selected={favorites.weapon === weapon.uuid}
            />
          </div>
        </div>
        <div className="valorant-panel relative aspect-[16/8]">
          <Image
            src={weapon.displayIcon}
            alt={`${weapon.displayName} weapon render`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-contain p-6"
          />
        </div>
      </header>

      {metrics.length ? (
        <section className="mt-9 grid border border-white/8 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map(([label, value]) => (
            <div key={label} className="border-b border-white/8 p-4 last:border-b-0 sm:border-r">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
                {label}
              </p>
              <p className="mt-1 font-display text-3xl font-black">{value}</p>
            </div>
          ))}
        </section>
      ) : null}

      {stats?.damageRanges.length ? (
        <section className="mt-11">
          <p className="eyebrow">Damage</p>
          <div
            role="region"
            aria-label={`${weapon.displayName} damage table`}
            tabIndex={0}
            className="tactical-scrollbar mt-5 overflow-x-auto border border-white/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <table className="w-full min-w-[42rem] border-collapse text-left">
              <thead className="bg-white/5 text-xs uppercase tracking-widest text-[var(--muted)]">
                <tr>
                  <th className="p-4">Range</th>
                  <th className="p-4">Head</th>
                  <th className="p-4">Body</th>
                  <th className="p-4">Leg</th>
                </tr>
              </thead>
              <tbody>
                {stats.damageRanges.map((range) => (
                  <tr
                    key={`${range.rangeStartMeters}-${range.rangeEndMeters}`}
                    className="border-t border-white/8"
                  >
                    <th className="p-4 font-mono text-sm">
                      {range.rangeStartMeters}–{range.rangeEndMeters}m
                    </th>
                    <td className="p-4 text-xl font-black text-[var(--accent)]">
                      {Math.round(range.headDamage)}
                    </td>
                    <td className="p-4 text-xl font-black">
                      {Math.round(range.bodyDamage)}
                    </td>
                    <td className="p-4 text-xl font-black text-[var(--muted)]">
                      {Math.round(range.legDamage)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="mt-11">
        <p className="eyebrow">Skin collection</p>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
          Pick one favorite skin for this weapon. Choosing another skin
          replaces the current choice instantly.
        </p>
        <CatalogBrowser
          items={weapon.skins
            .filter((skin) => skin.displayIcon)
            .map((skin) => {
              const tier = contentTiers.find(
                (item) => item.uuid === skin.contentTierUuid,
              );
              return {
                id: skin.uuid,
                href: `/weapons/${weapon.uuid}/skins/${skin.uuid}`,
                image: skin.displayIcon ?? weapon.displayIcon,
                title: skin.displayName,
                meta: tier?.displayName ?? "Standard issue",
                metaIcon: tier?.displayIcon,
                group: tier?.displayName ?? "Standard issue",
                variant: "wide" as const,
                imageFit: "contain" as const,
                favoriteScope: weapon.uuid,
              };
            })}
          groups={[
            ...contentTiers
              .filter((tier) =>
                weapon.skins.some(
                  (skin) => skin.contentTierUuid === tier.uuid,
                ),
              )
              .map((tier) => tier.displayName),
            ...(weapon.skins.some((skin) => !skin.contentTierUuid)
              ? ["Standard issue"]
              : []),
          ]}
          groupIcons={Object.fromEntries(
            contentTiers.map((tier) => [tier.displayName, tier.displayIcon]),
          )}
          columns="three"
          perPage={9}
          searchPlaceholder="Search this skin collection"
          favoriteCategory="skin"
          initialFavoriteIds={favorites.skin}
        />
      </section>
    </article>
  );
}
