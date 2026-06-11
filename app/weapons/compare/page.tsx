import type { Metadata } from "next";

import {
  WeaponComparison,
  type ComparisonWeapon,
} from "@/components/weapon-comparison";
import { PageHeading } from "@/components/page-heading";
import { createMetadata } from "@/lib/seo";
import { getWeapons } from "@/lib/valorant-api";

export const metadata: Metadata = createMetadata({
  title: "Compare Valorant Weapons",
  description:
    "Compare two Valorant weapons side by side across damage ranges, fire rate, handling, economy, penetration, accuracy, and alternate fire.",
  path: "/weapons/compare",
});

interface WeaponComparisonPageProps {
  searchParams: Promise<{ a?: string; b?: string }>;
}

export default async function WeaponComparisonPage({
  searchParams,
}: WeaponComparisonPageProps) {
  const [weapons, requested] = await Promise.all([getWeapons(), searchParams]);
  const comparisonWeapons: ComparisonWeapon[] = weapons.map((weapon) => ({
    uuid: weapon.uuid,
    name: weapon.displayName,
    image: weapon.displayIcon,
    category:
      weapon.shopData?.category ??
      weapon.category.split("::").at(-1) ??
      "Other",
    cost: weapon.shopData?.cost ?? null,
    stats: weapon.weaponStats
      ? {
          fireRate: weapon.weaponStats.fireRate,
          magazineSize: weapon.weaponStats.magazineSize,
          runSpeedMultiplier: weapon.weaponStats.runSpeedMultiplier,
          reloadTimeSeconds: weapon.weaponStats.reloadTimeSeconds,
          equipTimeSeconds: weapon.weaponStats.equipTimeSeconds,
          firstBulletAccuracy: weapon.weaponStats.firstBulletAccuracy,
          shotgunPelletCount: weapon.weaponStats.shotgunPelletCount,
          wallPenetration: weapon.weaponStats.wallPenetration,
          feature: weapon.weaponStats.feature,
          fireMode: weapon.weaponStats.fireMode,
          altFireType: weapon.weaponStats.altFireType,
          adsStats: weapon.weaponStats.adsStats
            ? {
                zoomMultiplier: weapon.weaponStats.adsStats.zoomMultiplier,
                fireRate: weapon.weaponStats.adsStats.fireRate,
                runSpeedMultiplier:
                  weapon.weaponStats.adsStats.runSpeedMultiplier,
                firstBulletAccuracy:
                  weapon.weaponStats.adsStats.firstBulletAccuracy,
              }
            : null,
          altShotgunStats: weapon.weaponStats.altShotgunStats,
          airBurstStats: weapon.weaponStats.airBurstStats,
          damageRanges: weapon.weaponStats.damageRanges.map((range) => ({
            start: range.rangeStartMeters,
            end: range.rangeEndMeters,
            head: range.headDamage,
            body: range.bodyDamage,
            leg: range.legDamage,
          })),
        }
      : null,
  }));
  const weaponIds = new Set(comparisonWeapons.map((weapon) => weapon.uuid));
  const vandal =
    comparisonWeapons.find((weapon) => weapon.name === "Vandal") ??
    comparisonWeapons[0];
  const phantom =
    comparisonWeapons.find((weapon) => weapon.name === "Phantom") ??
    comparisonWeapons[1] ??
    comparisonWeapons[0];
  const initialLeftId =
    requested.a && weaponIds.has(requested.a) ? requested.a : vandal.uuid;
  const requestedRightId =
    requested.b && weaponIds.has(requested.b) ? requested.b : phantom.uuid;
  const initialRightId =
    requestedRightId === initialLeftId
      ? comparisonWeapons.find((weapon) => weapon.uuid !== initialLeftId)?.uuid ??
        initialLeftId
      : requestedRightId;

  return (
    <section className="mx-auto max-w-[86rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeading
        eyebrow="Weapon lab"
        title="Compare weapons"
        description="Choose any two weapons and inspect every meaningful difference across economy, handling, damage ranges, penetration, and alternate fire."
      />
      <WeaponComparison
        weapons={comparisonWeapons}
        initialLeftId={initialLeftId}
        initialRightId={initialRightId}
      />
    </section>
  );
}
