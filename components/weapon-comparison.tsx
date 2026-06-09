"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";

export interface ComparisonWeapon {
  uuid: string;
  name: string;
  image: string;
  category: string;
  cost: number | null;
  stats: {
    fireRate: number;
    magazineSize: number;
    runSpeedMultiplier: number;
    reloadTimeSeconds: number;
    equipTimeSeconds: number;
    firstBulletAccuracy: number;
    shotgunPelletCount: number;
    wallPenetration: string;
    feature: string | null;
    fireMode: string | null;
    altFireType: string | null;
    adsStats: {
      zoomMultiplier: number;
      fireRate: number;
      runSpeedMultiplier: number;
      firstBulletAccuracy: number;
    } | null;
    altShotgunStats: {
      shotgunPelletCount: number;
      burstRate: number;
    } | null;
    airBurstStats: {
      shotgunPelletCount: number;
      burstDistance: number;
    } | null;
    damageRanges: Array<{
      start: number;
      end: number;
      head: number;
      body: number;
      leg: number;
    }>;
  } | null;
}

interface WeaponComparisonProps {
  weapons: ComparisonWeapon[];
  initialLeftId: string;
  initialRightId: string;
}

interface MetricRowProps {
  label: string;
  left: number | null;
  right: number | null;
  unit?: string;
  decimals?: number;
  lowerIsBetter?: boolean;
  neutral?: boolean;
}

type DamageRange = NonNullable<ComparisonWeapon["stats"]>["damageRanges"][number];

const DISTANCES = [0, 10, 20, 30, 40, 50] as const;

function cleanEnum(value: string | null): string {
  if (!value) return "None";
  return value.split("::").at(-1)?.replace(/([a-z])([A-Z])/g, "$1 $2") ?? value;
}

function formatNumber(
  value: number | null,
  decimals: number,
  unit: string,
): string {
  if (value === null || !Number.isFinite(value)) return "N/A";
  return `${value.toFixed(decimals).replace(/\.0+$/, "")}${unit}`;
}

function getDamageAt(
  weapon: ComparisonWeapon,
  distance: number,
): DamageRange | null {
  const ranges = weapon.stats?.damageRanges;
  if (!ranges?.length) return null;

  return (
    [...ranges]
      .sort((left, right) => right.start - left.start)
      .find((range) => distance >= range.start && distance <= range.end) ?? null
  );
}

function MetricRow({
  label,
  left,
  right,
  unit = "",
  decimals = 2,
  lowerIsBetter = false,
  neutral = false,
}: MetricRowProps) {
  const comparable = left !== null && right !== null;
  const tied = comparable && Math.abs(left - right) < 0.0001;
  const leftWins =
    comparable && !tied && (lowerIsBetter ? left < right : left > right);
  const rightWins =
    comparable && !tied && (lowerIsBetter ? right < left : right > left);
  const difference = comparable ? Math.abs(left - right) : null;

  return (
    <div className="comparison-row grid grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)] items-stretch border-t border-white/8">
      <div
        className={`flex min-h-20 items-center px-4 py-4 sm:px-6 ${
          leftWins && !neutral ? "bg-emerald-400/[0.07]" : ""
        }`}
      >
        <p
          className={`font-display text-2xl font-black ${
            leftWins && !neutral ? "text-emerald-300" : ""
          }`}
        >
          {formatNumber(left, decimals, unit)}
        </p>
      </div>
      <div className="grid place-items-center border-x border-white/8 px-2 py-3 text-center">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--muted)]">
            {label}
          </p>
          {difference !== null && !tied ? (
            <p className="mt-1 font-mono text-[10px] text-[#697687]">
              Δ {formatNumber(difference, decimals, unit)}
            </p>
          ) : null}
        </div>
      </div>
      <div
        className={`flex min-h-20 items-center justify-end px-4 py-4 text-right sm:px-6 ${
          rightWins && !neutral ? "bg-emerald-400/[0.07]" : ""
        }`}
      >
        <p
          className={`font-display text-2xl font-black ${
            rightWins && !neutral ? "text-emerald-300" : ""
          }`}
        >
          {formatNumber(right, decimals, unit)}
        </p>
      </div>
    </div>
  );
}

function TextMetricRow({
  label,
  left,
  right,
}: {
  label: string;
  left: string;
  right: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)] items-stretch border-t border-white/8">
      <p className="flex min-h-16 items-center px-4 py-3 text-sm font-black uppercase sm:px-6">
        {left}
      </p>
      <p className="grid place-items-center border-x border-white/8 px-2 text-center text-[10px] font-black uppercase tracking-[0.14em] text-[var(--muted)]">
        {label}
      </p>
      <p className="flex min-h-16 items-center justify-end px-4 py-3 text-right text-sm font-black uppercase sm:px-6">
        {right}
      </p>
    </div>
  );
}

function WeaponPicker({
  label,
  weapons,
  selected,
  excludedId,
  onSelect,
}: {
  label: string;
  weapons: ComparisonWeapon[];
  selected: ComparisonWeapon;
  excludedId: string;
  onSelect: (id: string) => void;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return weapons.filter(
      (weapon) =>
        weapon.uuid !== excludedId &&
        (!normalized ||
          `${weapon.name} ${weapon.category}`
            .toLocaleLowerCase()
            .includes(normalized)),
    );
  }, [excludedId, query, weapons]);

  return (
    <details ref={detailsRef} className="group relative">
      <summary className="valorant-action flex min-h-12 cursor-pointer list-none items-center justify-between border border-white/15 bg-black/20 px-4 text-left [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-[9px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
            {label}
          </span>
          <span className="mt-1 block text-sm font-black uppercase">
            {selected.name}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="text-[var(--accent)] transition group-open:rotate-180"
        >
          ↓
        </span>
      </summary>
      <div className="motion-pop absolute inset-x-0 top-[calc(100%+0.4rem)] z-30 border border-white/15 bg-[#111820] p-3 shadow-2xl shadow-black/60">
        <label className="block">
          <span className="sr-only">Search {label}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search weapons"
            className="min-h-11 w-full border border-white/12 bg-black/25 px-3 text-sm font-bold outline-none placeholder:text-[#687482] focus:border-[var(--accent)]"
          />
        </label>
        <div className="mt-2 max-h-64 overflow-y-auto">
          {filtered.map((weapon) => (
            <button
              key={weapon.uuid}
              type="button"
              onClick={() => {
                onSelect(weapon.uuid);
                setQuery("");
                detailsRef.current?.removeAttribute("open");
              }}
              className="flex min-h-12 w-full items-center justify-between border-b border-white/8 px-3 text-left text-xs font-black uppercase tracking-[0.1em] transition hover:bg-white/6 hover:text-white"
            >
              <span>{weapon.name}</span>
              <span className="text-[10px] text-[var(--muted)]">
                {weapon.category}
              </span>
            </button>
          ))}
        </div>
      </div>
    </details>
  );
}

export function WeaponComparison({
  weapons,
  initialLeftId,
  initialRightId,
}: WeaponComparisonProps) {
  const weaponMap = useMemo(
    () => new Map(weapons.map((weapon) => [weapon.uuid, weapon])),
    [weapons],
  );
  const [leftId, setLeftId] = useState(initialLeftId);
  const [rightId, setRightId] = useState(initialRightId);
  const [distance, setDistance] =
    useState<(typeof DISTANCES)[number]>(0);
  const left = weaponMap.get(leftId) ?? weapons[0];
  const right = weaponMap.get(rightId) ?? weapons[1] ?? weapons[0];

  function updateSelection(nextLeftId: string, nextRightId: string) {
    setLeftId(nextLeftId);
    setRightId(nextRightId);
    const query = new URLSearchParams({
      a: nextLeftId,
      b: nextRightId,
    });
    window.history.replaceState(null, "", `/weapons/compare?${query}`);
  }

  function swapWeapons() {
    updateSelection(right.uuid, left.uuid);
  }

  const leftDamage = getDamageAt(left, distance);
  const rightDamage = getDamageAt(right, distance);
  const leftPellets = left.stats?.shotgunPelletCount ?? 1;
  const rightPellets = right.stats?.shotgunPelletCount ?? 1;

  return (
    <div className="mt-12">
      <div className="grid gap-px border border-white/10 bg-white/10 lg:grid-cols-[1fr_auto_1fr]">
        {[left, right].map((weapon, index) => (
          <article
            key={`${weapon.uuid}-${index}`}
            className={`relative bg-[var(--panel)] p-5 sm:p-7 ${
              index === 1
                ? "order-3 lg:order-none lg:col-start-3"
                : "order-1 lg:order-none"
            }`}
          >
            <WeaponPicker
              label={index === 0 ? "Weapon A" : "Weapon B"}
              weapons={weapons}
              selected={weapon}
              excludedId={index === 0 ? right.uuid : left.uuid}
              onSelect={(id) =>
                index === 0
                  ? updateSelection(id, right.uuid)
                  : updateSelection(left.uuid, id)
              }
            />
            <div className="relative mt-5 aspect-[16/7]">
              <Image
                src={weapon.image}
                alt={`${weapon.name} weapon render`}
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-contain p-3"
              />
            </div>
            <div className="mt-4 flex items-end justify-between gap-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
                  {weapon.category}
                </p>
                <h2 className="mt-1 font-display text-4xl font-black uppercase tracking-[-0.05em]">
                  {weapon.name}
                </h2>
              </div>
              <p className="font-mono text-xs uppercase text-[var(--muted)]">
                {weapon.cost === null ? "Standard" : `${weapon.cost} cr`}
              </p>
            </div>
          </article>
        ))}
        <div className="order-2 grid place-items-center bg-[#0e141b] p-3 lg:order-none lg:col-start-2 lg:row-start-1">
          <button
            type="button"
            onClick={swapWeapons}
            aria-label="Swap compared weapons"
            className="valorant-action grid size-12 place-items-center border border-white/15 text-xl font-black text-[var(--accent)]"
          >
            ⇄
          </button>
        </div>
      </div>

      {!left.stats || !right.stats ? (
        <div className="mt-6 border-l-2 border-amber-300 bg-amber-300/5 p-5 text-sm leading-6 text-[var(--muted)]">
          Weapons without firearm statistics can still be selected, but their
          unavailable values are marked N/A.
        </div>
      ) : null}
      <p className="mt-5 text-xs leading-5 text-[#718091]">
        Green marks the stronger numeric value. Lower values win for cost,
        reload time, equip time, and shot spread.
      </p>

      <section className="mt-14">
        <p className="eyebrow">Economy and handling</p>
        <div className="mt-7 border border-white/8 bg-[var(--panel)]">
          <MetricRow
            label="Cost"
            left={left.cost}
            right={right.cost}
            unit=" cr"
            decimals={0}
            lowerIsBetter
          />
          <MetricRow
            label="Fire rate"
            left={left.stats?.fireRate ?? null}
            right={right.stats?.fireRate ?? null}
            unit="/s"
          />
          <MetricRow
            label="Magazine"
            left={left.stats?.magazineSize ?? null}
            right={right.stats?.magazineSize ?? null}
            decimals={0}
          />
          <MetricRow
            label="Reload"
            left={left.stats?.reloadTimeSeconds ?? null}
            right={right.stats?.reloadTimeSeconds ?? null}
            unit="s"
            lowerIsBetter
          />
          <MetricRow
            label="Equip"
            left={left.stats?.equipTimeSeconds ?? null}
            right={right.stats?.equipTimeSeconds ?? null}
            unit="s"
            lowerIsBetter
          />
          <MetricRow
            label="Run speed"
            left={
              left.stats ? left.stats.runSpeedMultiplier * 100 : null
            }
            right={
              right.stats ? right.stats.runSpeedMultiplier * 100 : null
            }
            unit="%"
            decimals={0}
          />
          <MetricRow
            label="First shot spread"
            left={left.stats?.firstBulletAccuracy ?? null}
            right={right.stats?.firstBulletAccuracy ?? null}
            lowerIsBetter
          />
          <TextMetricRow
            label="Penetration"
            left={cleanEnum(left.stats?.wallPenetration ?? null)}
            right={cleanEnum(right.stats?.wallPenetration ?? null)}
          />
          <TextMetricRow
            label="Fire mode"
            left={cleanEnum(left.stats?.fireMode ?? null)}
            right={cleanEnum(right.stats?.fireMode ?? null)}
          />
          <TextMetricRow
            label="Feature"
            left={cleanEnum(left.stats?.feature ?? null)}
            right={cleanEnum(right.stats?.feature ?? null)}
          />
        </div>
      </section>

      <section className="mt-14">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Damage comparison</p>
            <h2 className="mt-4 font-display text-4xl font-black uppercase tracking-[-0.045em]">
              At {distance} meters
            </h2>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Choose distance">
            {DISTANCES.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={distance === item}
                onClick={() => setDistance(item)}
                className="valorant-action min-h-11 min-w-12 border border-white/15 px-3 text-xs font-black aria-pressed:border-[var(--accent)] aria-pressed:bg-[var(--accent)]"
              >
                {item}m
              </button>
            ))}
          </div>
        </div>
        <div className="mt-7 border border-white/8 bg-[var(--panel)]">
          <MetricRow
            label="Head"
            left={leftDamage?.head ?? null}
            right={rightDamage?.head ?? null}
            decimals={1}
          />
          <MetricRow
            label="Body"
            left={leftDamage?.body ?? null}
            right={rightDamage?.body ?? null}
            decimals={1}
          />
          <MetricRow
            label="Leg"
            left={leftDamage?.leg ?? null}
            right={rightDamage?.leg ?? null}
            decimals={1}
          />
          <MetricRow
            label="Pellets"
            left={left.stats?.shotgunPelletCount ?? null}
            right={right.stats?.shotgunPelletCount ?? null}
            decimals={0}
            neutral
          />
          <MetricRow
            label="Full body hit"
            left={leftDamage ? leftDamage.body * leftPellets : null}
            right={rightDamage ? rightDamage.body * rightPellets : null}
            decimals={1}
          />
        </div>
        <p className="mt-4 text-xs leading-5 text-[#718091]">
          Shotgun damage is shown per pellet. Full body hit multiplies body
          damage by the primary-fire pellet count and represents theoretical
          maximum damage when every pellet connects.
        </p>
      </section>

      <section className="mt-14">
        <p className="eyebrow">Alternate fire and ADS</p>
        <div className="mt-7 border border-white/8 bg-[var(--panel)]">
          <TextMetricRow
            label="Alt fire"
            left={cleanEnum(left.stats?.altFireType ?? null)}
            right={cleanEnum(right.stats?.altFireType ?? null)}
          />
          <MetricRow
            label="Zoom"
            left={left.stats?.adsStats?.zoomMultiplier ?? null}
            right={right.stats?.adsStats?.zoomMultiplier ?? null}
            unit="x"
            neutral
          />
          <MetricRow
            label="ADS fire rate"
            left={left.stats?.adsStats?.fireRate ?? null}
            right={right.stats?.adsStats?.fireRate ?? null}
            unit="/s"
          />
          <MetricRow
            label="ADS move speed"
            left={
              left.stats?.adsStats
                ? left.stats.adsStats.runSpeedMultiplier * 100
                : null
            }
            right={
              right.stats?.adsStats
                ? right.stats.adsStats.runSpeedMultiplier * 100
                : null
            }
            unit="%"
            decimals={0}
          />
          <MetricRow
            label="ADS spread"
            left={left.stats?.adsStats?.firstBulletAccuracy ?? null}
            right={right.stats?.adsStats?.firstBulletAccuracy ?? null}
            lowerIsBetter
          />
          <MetricRow
            label="Alt pellets"
            left={
              left.stats?.altShotgunStats?.shotgunPelletCount ??
              left.stats?.airBurstStats?.shotgunPelletCount ??
              null
            }
            right={
              right.stats?.altShotgunStats?.shotgunPelletCount ??
              right.stats?.airBurstStats?.shotgunPelletCount ??
              null
            }
            decimals={0}
            neutral
          />
          <MetricRow
            label="Alt burst rate"
            left={left.stats?.altShotgunStats?.burstRate ?? null}
            right={right.stats?.altShotgunStats?.burstRate ?? null}
            unit="/s"
          />
          <MetricRow
            label="Burst distance"
            left={left.stats?.airBurstStats?.burstDistance ?? null}
            right={right.stats?.airBurstStats?.burstDistance ?? null}
            unit="m"
            neutral
          />
        </div>
      </section>
    </div>
  );
}
