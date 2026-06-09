import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { CatalogBrowser } from "@/components/catalog-browser";
import { getWeapon } from "@/lib/valorant-api";

interface WeaponPageProps {
  params: Promise<{ uuid: string }>;
}

export async function generateMetadata({
  params,
}: WeaponPageProps): Promise<Metadata> {
  try {
    const weapon = await getWeapon((await params).uuid);
    return { title: weapon.displayName };
  } catch {
    return { title: "Weapon not found" };
  }
}

export default async function WeaponPage({ params }: WeaponPageProps) {
  const { uuid } = await params;
  let weapon;

  try {
    weapon = await getWeapon(uuid);
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
    <article className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
      <header className="grid items-center gap-12 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <p className="eyebrow">{weapon.shopData?.category ?? "Weapon"}</p>
          <h1 className="mt-6 font-display text-7xl font-black uppercase leading-[0.85] tracking-[-0.07em] sm:text-9xl">
            {weapon.displayName}
          </h1>
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            {weapon.shopData ? `${weapon.shopData.cost} credits` : "Standard weapon"}
          </p>
        </div>
        <div className="valorant-panel relative aspect-[16/8]">
          <Image
            src={weapon.displayIcon}
            alt={`${weapon.displayName} weapon render`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-contain p-10"
          />
        </div>
      </header>

      {metrics.length ? (
        <section className="mt-16 grid border border-white/8 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map(([label, value]) => (
            <div key={label} className="border-b border-white/8 p-6 last:border-b-0 sm:border-r">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
                {label}
              </p>
              <p className="mt-2 font-display text-4xl font-black">{value}</p>
            </div>
          ))}
        </section>
      ) : null}

      {stats?.damageRanges.length ? (
        <section className="mt-20">
          <p className="eyebrow">Damage</p>
          <div className="mt-8 overflow-x-auto border border-white/8">
            <table className="w-full min-w-[42rem] border-collapse text-left">
              <thead className="bg-white/5 text-xs uppercase tracking-widest text-[var(--muted)]">
                <tr>
                  <th className="p-5">Range</th>
                  <th className="p-5">Head</th>
                  <th className="p-5">Body</th>
                  <th className="p-5">Leg</th>
                </tr>
              </thead>
              <tbody>
                {stats.damageRanges.map((range) => (
                  <tr
                    key={`${range.rangeStartMeters}-${range.rangeEndMeters}`}
                    className="border-t border-white/8"
                  >
                    <th className="p-5 font-mono text-sm">
                      {range.rangeStartMeters}–{range.rangeEndMeters}m
                    </th>
                    <td className="p-5 text-2xl font-black text-[var(--accent)]">
                      {Math.round(range.headDamage)}
                    </td>
                    <td className="p-5 text-2xl font-black">
                      {Math.round(range.bodyDamage)}
                    </td>
                    <td className="p-5 text-2xl font-black text-[var(--muted)]">
                      {Math.round(range.legDamage)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="mt-20">
        <p className="eyebrow">Skin collection</p>
        <CatalogBrowser
          items={weapon.skins
            .filter((skin) => skin.displayIcon)
            .map((skin) => ({
              id: skin.uuid,
              image: skin.displayIcon ?? weapon.displayIcon,
              title: skin.displayName,
              meta: weapon.displayName,
              group: "Collection",
              variant: "wide" as const,
              imageFit: "contain" as const,
            }))}
          groups={[]}
          columns="three"
          perPage={9}
          searchPlaceholder="Search this skin collection"
        />
      </section>
    </article>
  );
}
