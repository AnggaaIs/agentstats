import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { FavoriteButton } from "@/components/favorite-button";
import { JsonLd } from "@/components/json-ld";
import { RouteLink } from "@/components/route-link";
import { VideoPreviewModal } from "@/components/video-preview-modal";
import {
  getCommunityCountsOrEmpty,
  getCurrentFavoritesOrEmpty,
} from "@/lib/community";
import { breadcrumbJsonLd, createMetadata } from "@/lib/seo";
import {
  getContentTiers,
  getWeapon,
  ValorantApiError,
} from "@/lib/valorant-api";

interface SkinPageProps {
  params: Promise<{ uuid: string; skinUuid: string }>;
}

function cleanName(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function formatLevelName(value: string | null, index: number): string {
  if (!value) return index === 0 ? "Base model" : `Upgrade level ${index + 1}`;
  return value.split("::").at(-1)?.replaceAll("_", " ") ?? value;
}

export async function generateMetadata({
  params,
}: SkinPageProps): Promise<Metadata> {
  const { uuid, skinUuid } = await params;

  try {
    const weapon = await getWeapon(uuid);
    const skin = weapon.skins.find((item) => item.uuid === skinUuid);
    if (!skin) {
      return createMetadata({
        title: "Skin not found",
        path: `/weapons/${uuid}`,
        noIndex: true,
      });
    }

    const name = cleanName(skin.displayName);
    return createMetadata({
      title: `${name} - Chromas, Levels & Video`,
      description: `Explore the ${name} Valorant skin, including ${skin.chromas.length} chroma variants, ${skin.levels.length} upgrade levels, renders, and available preview videos.`,
      path: `/weapons/${uuid}/skins/${skinUuid}`,
      image: skin.chromas[0]?.fullRender ?? skin.displayIcon,
      imageAlt: `${name} Valorant skin`,
    });
  } catch {
    return createMetadata({
      title: "Skin not found",
      path: `/weapons/${uuid}`,
      noIndex: true,
    });
  }
}

export default async function SkinPage({ params }: SkinPageProps) {
  const { uuid, skinUuid } = await params;
  let weapon;
  try {
    weapon = await getWeapon(uuid);
  } catch (error) {
    if (error instanceof ValorantApiError && error.status === 404) notFound();
    throw error;
  }
  const [contentTiers, favorites, favoriteCounts] = await Promise.all([
    getContentTiers(),
    getCurrentFavoritesOrEmpty(),
    getCommunityCountsOrEmpty("skin"),
  ]);
  const skin = weapon?.skins.find((item) => item.uuid === skinUuid);

  if (!skin) notFound();

  const tier = contentTiers.find(
    (item) => item.uuid === skin.contentTierUuid,
  );
  const heroImage =
    skin.chromas[0]?.fullRender ?? skin.displayIcon ?? weapon.displayIcon;
  const accent = tier?.highlightColor
    ? `#${tier.highlightColor.slice(0, 6)}`
    : "var(--accent)";

  return (
    <article>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Valorant Weapons", path: "/weapons" },
          { name: weapon.displayName, path: `/weapons/${weapon.uuid}` },
          {
            name: cleanName(skin.displayName),
            path: `/weapons/${weapon.uuid}/skins/${skin.uuid}`,
          },
        ])}
      />
      <header className="grid-noise border-b border-white/8">
        <div className="mx-auto grid max-w-[86rem] gap-7 px-4 py-9 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-8 lg:py-11">
          <div className="min-w-0">
            <RouteLink
              href={`/weapons/${weapon.uuid}`}
              className="text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)] transition hover:text-white"
            >
              Back to {weapon.displayName}
            </RouteLink>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {tier ? (
                <Image
                  src={tier.displayIcon}
                  alt=""
                  width={32}
                  height={32}
                  className="size-8 object-contain"
                />
              ) : null}
              <p
                className="text-xs font-black uppercase tracking-[0.18em]"
                style={{ color: accent }}
              >
                {tier?.displayName ?? "Standard issue"}
              </p>
            </div>
            <h1 className="mt-4 break-words font-display text-[clamp(2rem,8vw,4.25rem)] font-black uppercase leading-[0.9] tracking-[-0.05em]">
              {cleanName(skin.displayName)}
            </h1>
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
              {skin.chromas.length} chroma
              {skin.chromas.length === 1 ? "" : "s"} / {skin.levels.length}{" "}
              upgrade level{skin.levels.length === 1 ? "" : "s"}
            </p>
            <div className="mt-5">
              <FavoriteButton
                category="skin"
                scopeKey={weapon.uuid}
                targetId={skin.uuid}
                targetName={cleanName(skin.displayName)}
                selected={favorites.skin[weapon.uuid] === skin.uuid}
                selectedTargetId={favorites.skin[weapon.uuid] ?? null}
                voteCount={
                  favoriteCounts.find((count) => count.targetId === skin.uuid)
                    ?.votes ?? 0
                }
              />
            </div>
          </div>

          <div className="relative aspect-[16/10] min-w-0 overflow-hidden border border-white/10 bg-[#171f28]">
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{ backgroundColor: accent }}
            />
            <Image
              src={heroImage}
              alt={`${cleanName(skin.displayName)} render`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-contain p-5 sm:p-7"
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[86rem] px-4 py-9 sm:px-6 lg:px-8 lg:py-11">
        <section>
          <p className="eyebrow">Color variants</p>
          <h2 className="mt-4 font-display text-2xl font-black uppercase tracking-[-0.04em] sm:text-3xl">
            Chroma archive
          </h2>
          <div className="mt-6 grid min-w-0 gap-4 sm:grid-cols-2">
            {skin.chromas.map((chroma, index) => (
              <article
                key={chroma.uuid}
                className="min-w-0 border border-white/10 bg-[var(--panel)]"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-[#202832]">
                  <Image
                    src={
                      chroma.fullRender ??
                      chroma.displayIcon ??
                      skin.displayIcon ??
                      weapon.displayIcon
                    }
                    alt={`${cleanName(chroma.displayName)} render`}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-contain p-5 sm:p-7"
                  />
                </div>
                <div className="flex min-w-0 items-center gap-3 border-t border-white/8 p-4 sm:p-5">
                  {chroma.swatch ? (
                    <Image
                      src={chroma.swatch}
                      alt=""
                      width={40}
                      height={40}
                      className="size-10 shrink-0 border border-white/15 object-cover"
                    />
                  ) : (
                    <span className="grid size-10 shrink-0 place-items-center border border-white/15 font-mono text-xs text-[var(--muted)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  )}
                  <h3 className="responsive-text font-display text-lg font-black uppercase leading-tight tracking-[-0.025em]">
                    {cleanName(chroma.displayName)}
                  </h3>
                </div>
                {chroma.streamedVideo ? (
                  <div className="border-t border-white/8 p-4 sm:p-5">
                    <VideoPreviewModal
                      src={chroma.streamedVideo}
                      title={cleanName(chroma.displayName)}
                      poster={chroma.displayIcon}
                      className="w-full sm:w-auto"
                    />
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="mt-11">
          <p className="eyebrow">Upgrade path</p>
          <h2 className="mt-4 font-display text-2xl font-black uppercase tracking-[-0.04em] sm:text-3xl">
            Skin levels
          </h2>
          <ol className="mt-6 grid gap-px border border-white/10 bg-white/10">
            {skin.levels.map((level, index) => (
              <li
                key={level.uuid}
                className="grid min-w-0 gap-4 bg-[var(--panel)] p-4 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-center sm:p-5"
              >
                <span className="font-display text-2xl font-black text-white/25">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="responsive-text font-display text-xl font-black uppercase tracking-[-0.025em]">
                    {formatLevelName(level.levelItem, index)}
                  </p>
                  <p className="responsive-text mt-1 text-xs text-[var(--muted)]">
                    {cleanName(level.displayName)}
                  </p>
                </div>
                {level.streamedVideo ? (
                  <VideoPreviewModal
                    src={level.streamedVideo}
                    title={`${cleanName(skin.displayName)} - ${formatLevelName(level.levelItem, index)}`}
                    poster={level.displayIcon}
                    className="w-full sm:w-auto"
                  />
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
                    Static level
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </article>
  );
}
